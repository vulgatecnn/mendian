"""
企业微信部门同步服务
提供部门信息的同步功能
"""
import requests
import logging
from django.conf import settings
from django.db import transaction
from typing import List, Dict, Optional
from .wechat_token import token_manager
from ..models import Department

logger = logging.getLogger(__name__)


class WeChatDepartmentService:
    """企业微信部门同步服务"""
    
    def __init__(self):
        """初始化部门同步服务"""
        self.api_base_url = settings.WECHAT_API_BASE_URL
        self.api_timeout = settings.WECHAT_API_TIMEOUT
        self.token_manager = token_manager
    
    def sync_departments(self, department_id: Optional[int] = None) -> Dict:
        """
        同步部门信息
        
        Args:
            department_id: 部门 ID，如果为 None 则同步所有部门
            
        Returns:
            同步结果字典，包含成功数量、失败数量等信息
        """
        logger.info(f"开始同步部门信息，department_id={department_id}")
        
        result = {
            'success': False,
            'total': 0,
            'created': 0,
            'updated': 0,
            'failed': 0,
            'errors': [],
        }
        
        try:
            # 获取企业微信部门列表
            wechat_departments = self._fetch_departments_from_api(department_id)
            result['total'] = len(wechat_departments)
            
            if not wechat_departments:
                logger.warning("未获取到任何部门数据")
                result['success'] = True
                return result
            
            # 同步部门到数据库
            created, updated, failed = self._sync_departments_to_db(wechat_departments)
            
            result['created'] = created
            result['updated'] = updated
            result['failed'] = failed
            result['success'] = True
            
            logger.info(
                f"部门同步完成: 总数={result['total']}, "
                f"新增={created}, 更新={updated}, 失败={failed}"
            )
            
        except Exception as e:
            logger.error(f"同步部门失败: {e}", exc_info=True)
            result['errors'].append(str(e))
        
        return result
    
    def _fetch_departments_from_api(self, department_id: Optional[int] = None) -> List[Dict]:
        """
        从企业微信 API 获取部门列表
        
        Args:
            department_id: 部门 ID，如果为 None 则获取所有部门
            
        Returns:
            部门列表
        """
        access_token = self.token_manager.get_access_token()
        
        url = f"{self.api_base_url}/department/list"
        params = {'access_token': access_token}
        
        if department_id is not None:
            params['id'] = department_id
        
        try:
            logger.debug(f"请求企业微信部门列表 API: {url}")
            response = requests.get(url, params=params, timeout=self.api_timeout)
            response.raise_for_status()
            
            data = response.json()
            
            # 检查错误码
            errcode = data.get('errcode', 0)
            if errcode != 0:
                errmsg = data.get('errmsg', '未知错误')
                
                # 如果是令牌过期，刷新令牌后重试
                if errcode in [40014, 42001]:
                    logger.warning(f"访问令牌过期或无效，尝试刷新令牌: {errmsg}")
                    access_token = self.token_manager.refresh_token()
                    params['access_token'] = access_token
                    
                    # 重试请求
                    response = requests.get(url, params=params, timeout=self.api_timeout)
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get('errcode', 0) != 0:
                        raise Exception(f"获取部门列表失败: {data.get('errmsg')}")
                else:
                    raise Exception(f"获取部门列表失败: {errmsg}")
            
            # 获取部门列表
            departments = data.get('department', [])
            logger.info(f"成功获取 {len(departments)} 个部门")
            
            return departments
            
        except requests.exceptions.Timeout:
            logger.error(f"请求企业微信 API 超时（超过 {self.api_timeout} 秒）")
            raise Exception("请求企业微信 API 超时")
        except requests.exceptions.RequestException as e:
            logger.error(f"请求企业微信 API 失败: {e}")
            raise Exception(f"请求企业微信 API 失败: {e}")
    
    @transaction.atomic
    def _sync_departments_to_db(self, wechat_departments: List[Dict]) -> tuple:
        """
        将企业微信部门数据同步到数据库
        
        Args:
            wechat_departments: 企业微信部门列表
            
        Returns:
            (新增数量, 更新数量, 失败数量)
        """
        created_count = 0
        updated_count = 0
        failed_count = 0
        
        # 先按 id 排序，确保父部门先创建
        wechat_departments.sort(key=lambda x: x.get('id', 0))
        
        # 创建部门 ID 映射（企微 ID -> 数据库对象）
        dept_map = {}
        
        for wechat_dept in wechat_departments:
            try:
                wechat_dept_id = wechat_dept.get('id')
                name = wechat_dept.get('name', '')
                parent_id = wechat_dept.get('parentid', 0)
                order = wechat_dept.get('order', 0)
                
                if not wechat_dept_id or not name:
                    logger.warning(f"部门数据不完整，跳过: {wechat_dept}")
                    failed_count += 1
                    continue
                
                # 查找或创建部门
                dept, created = Department.objects.update_or_create(
                    wechat_dept_id=wechat_dept_id,
                    defaults={
                        'name': name,
                        'order': order,
                    }
                )
                
                # 保存到映射
                dept_map[wechat_dept_id] = dept
                
                if created:
                    created_count += 1
                    logger.debug(f"创建部门: {name} (ID={wechat_dept_id})")
                else:
                    updated_count += 1
                    logger.debug(f"更新部门: {name} (ID={wechat_dept_id})")
                
            except Exception as e:
                logger.error(f"同步部门失败: {wechat_dept}, 错误: {e}")
                failed_count += 1
        
        # 第二遍：设置父部门关系
        for wechat_dept in wechat_departments:
            try:
                wechat_dept_id = wechat_dept.get('id')
                parent_id = wechat_dept.get('parentid', 0)
                
                if wechat_dept_id not in dept_map:
                    continue
                
                dept = dept_map[wechat_dept_id]
                
                # 设置父部门（parentid=0 表示根部门）
                if parent_id and parent_id != 0:
                    if parent_id in dept_map:
                        dept.parent = dept_map[parent_id]
                        dept.save(update_fields=['parent'])
                        logger.debug(f"设置部门 {dept.name} 的父部门为 {dept.parent.name}")
                    else:
                        logger.warning(f"找不到父部门 ID={parent_id}，部门 {dept.name} 的父部门关系未设置")
                else:
                    # 根部门，确保 parent 为 None
                    if dept.parent is not None:
                        dept.parent = None
                        dept.save(update_fields=['parent'])
                
            except Exception as e:
                logger.error(f"设置部门父子关系失败: {wechat_dept}, 错误: {e}")
        
        return created_count, updated_count, failed_count
    
    def get_department_tree(self, parent_id: Optional[int] = None) -> List[Dict]:
        """
        获取部门树形结构
        优化：使用 prefetch_related 预加载子部门，减少递归查询
        
        Args:
            parent_id: 父部门 ID，如果为 None 则获取根部门
            
        Returns:
            部门树形结构列表
        """
        if parent_id is None:
            # 获取根部门，预加载所有子部门
            departments = Department.objects.filter(
                parent__isnull=True
            ).prefetch_related(
                'children',
                'children__children',
                'children__children__children',
                'children__children__children__children'
            ).order_by('order', 'id')
        else:
            # 获取指定父部门的子部门
            departments = Department.objects.filter(
                parent_id=parent_id
            ).prefetch_related(
                'children',
                'children__children',
                'children__children__children'
            ).order_by('order', 'id')
        
        result = []
        for dept in departments:
            dept_dict = {
                'id': dept.id,
                'wechat_dept_id': dept.wechat_dept_id,
                'name': dept.name,
                'order': dept.order,
                'parent_id': dept.parent_id,
                'children': self._build_children_tree(dept),
            }
            result.append(dept_dict)
        
        return result
    
    def _build_children_tree(self, department) -> List[Dict]:
        """
        构建子部门树（利用预加载的数据，避免额外查询）
        
        Args:
            department: 部门对象
            
        Returns:
            子部门树形结构列表
        """
        children = []
        for child in department.children.all():
            child_dict = {
                'id': child.id,
                'wechat_dept_id': child.wechat_dept_id,
                'name': child.name,
                'order': child.order,
                'parent_id': child.parent_id,
                'children': self._build_children_tree(child),
            }
            children.append(child_dict)
        
        return sorted(children, key=lambda x: (x['order'], x['id']))


# 全局部门服务实例
department_service = WeChatDepartmentService()
