"""
企业微信用户同步服务
提供用户信息的同步功能
"""
import requests
import logging
from django.conf import settings
from django.db import transaction
from django.contrib.auth.hashers import make_password
from typing import List, Dict, Optional
from .wechat_token import token_manager
from ..models import User, Department

logger = logging.getLogger(__name__)


class WeChatUserService:
    """企业微信用户同步服务"""
    
    def __init__(self):
        """初始化用户同步服务"""
        self.api_base_url = settings.WECHAT_API_BASE_URL
        self.api_timeout = settings.WECHAT_API_TIMEOUT
        self.token_manager = token_manager
    
    def sync_users(self, department_id: Optional[int] = None, fetch_child: bool = True) -> Dict:
        """
        同步用户信息
        
        Args:
            department_id: 部门 ID，如果为 None 则同步所有部门的用户
            fetch_child: 是否递归获取子部门的用户
            
        Returns:
            同步结果字典，包含成功数量、失败数量等信息
        """
        logger.info(f"开始同步用户信息，department_id={department_id}, fetch_child={fetch_child}")
        
        result = {
            'success': False,
            'total': 0,
            'created': 0,
            'updated': 0,
            'failed': 0,
            'errors': [],
        }
        
        try:
            # 如果没有指定部门，获取所有部门的用户
            if department_id is None:
                # 优化：只查询需要的字段，减少内存使用
                departments = Department.objects.only('id', 'wechat_dept_id', 'name').all()
                all_users = []
                
                for dept in departments:
                    try:
                        users = self._fetch_users_from_api(dept.wechat_dept_id, fetch_child=False)
                        all_users.extend(users)
                    except Exception as e:
                        logger.error(f"获取部门 {dept.name} 的用户失败: {e}")
                        result['errors'].append(f"部门 {dept.name}: {str(e)}")
                
                # 去重（根据 userid）
                seen = set()
                wechat_users = []
                for user in all_users:
                    userid = user.get('userid')
                    if userid and userid not in seen:
                        seen.add(userid)
                        wechat_users.append(user)
            else:
                # 获取指定部门的用户
                wechat_users = self._fetch_users_from_api(department_id, fetch_child)
            
            result['total'] = len(wechat_users)
            
            if not wechat_users:
                logger.warning("未获取到任何用户数据")
                result['success'] = True
                return result
            
            # 同步用户到数据库
            created, updated, failed = self._sync_users_to_db(wechat_users)
            
            result['created'] = created
            result['updated'] = updated
            result['failed'] = failed
            result['success'] = True
            
            logger.info(
                f"用户同步完成: 总数={result['total']}, "
                f"新增={created}, 更新={updated}, 失败={failed}"
            )
            
        except Exception as e:
            logger.error(f"同步用户失败: {e}", exc_info=True)
            result['errors'].append(str(e))
        
        return result
    
    def _fetch_users_from_api(self, department_id: int, fetch_child: bool = True) -> List[Dict]:
        """
        从企业微信 API 获取用户列表
        
        Args:
            department_id: 部门 ID
            fetch_child: 是否递归获取子部门的用户
            
        Returns:
            用户列表
        """
        access_token = self.token_manager.get_access_token()
        
        url = f"{self.api_base_url}/user/list"
        params = {
            'access_token': access_token,
            'department_id': department_id,
            'fetch_child': 1 if fetch_child else 0,
        }
        
        try:
            logger.debug(f"请求企业微信用户列表 API: {url}, department_id={department_id}")
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
                        raise Exception(f"获取用户列表失败: {data.get('errmsg')}")
                else:
                    raise Exception(f"获取用户列表失败: {errmsg}")
            
            # 获取用户列表
            users = data.get('userlist', [])
            logger.info(f"成功获取部门 {department_id} 的 {len(users)} 个用户")
            
            return users
            
        except requests.exceptions.Timeout:
            logger.error(f"请求企业微信 API 超时（超过 {self.api_timeout} 秒）")
            raise Exception("请求企业微信 API 超时")
        except requests.exceptions.RequestException as e:
            logger.error(f"请求企业微信 API 失败: {e}")
            raise Exception(f"请求企业微信 API 失败: {e}")
    
    @transaction.atomic
    def _sync_users_to_db(self, wechat_users: List[Dict]) -> tuple:
        """
        将企业微信用户数据同步到数据库
        
        Args:
            wechat_users: 企业微信用户列表
            
        Returns:
            (新增数量, 更新数量, 失败数量)
        """
        created_count = 0
        updated_count = 0
        failed_count = 0
        
        for wechat_user in wechat_users:
            try:
                userid = wechat_user.get('userid', '')
                name = wechat_user.get('name', '')
                mobile = wechat_user.get('mobile', '')
                department_ids = wechat_user.get('department', [])
                position = wechat_user.get('position', '')
                status = wechat_user.get('status', 1)  # 1=已激活, 2=已禁用, 4=未激活
                
                if not userid:
                    logger.warning(f"用户数据缺少 userid，跳过: {wechat_user}")
                    failed_count += 1
                    continue
                
                if not mobile:
                    logger.warning(f"用户 {name} ({userid}) 没有手机号，跳过")
                    failed_count += 1
                    continue
                
                # 查找主部门（取第一个部门）
                # 优化：使用缓存避免重复查询相同部门
                department = None
                if department_ids:
                    main_dept_id = department_ids[0]
                    try:
                        # 使用 only 只查询需要的字段
                        department = Department.objects.only('id', 'name').get(wechat_dept_id=main_dept_id)
                    except Department.DoesNotExist:
                        logger.warning(f"找不到部门 ID={main_dept_id}，用户 {name} 的部门关系未设置")
                
                # 确定用户是否启用（企微状态 1=已激活）
                is_active = (status == 1)
                
                # 查找或创建用户
                user, created = User.objects.update_or_create(
                    wechat_user_id=userid,
                    defaults={
                        'username': userid,  # 使用企微 userid 作为用户名
                        'first_name': name,
                        'phone': mobile,
                        'department': department,
                        'position': position,
                        'is_active': is_active,
                    }
                )
                
                # 如果是新创建的用户，设置默认密码
                if created:
                    # 默认密码为手机号后6位
                    default_password = mobile[-6:] if len(mobile) >= 6 else '123456'
                    user.password = make_password(default_password)
                    user.save(update_fields=['password'])
                    
                    created_count += 1
                    logger.debug(f"创建用户: {name} ({userid}), 手机号: {mobile}")
                else:
                    updated_count += 1
                    logger.debug(f"更新用户: {name} ({userid}), 手机号: {mobile}")
                
            except Exception as e:
                logger.error(f"同步用户失败: {wechat_user}, 错误: {e}")
                failed_count += 1
        
        return created_count, updated_count, failed_count
    
    def get_user_detail(self, userid: str) -> Optional[Dict]:
        """
        获取用户详细信息
        
        Args:
            userid: 企业微信用户 ID
            
        Returns:
            用户详细信息字典，如果获取失败则返回 None
        """
        access_token = self.token_manager.get_access_token()
        
        url = f"{self.api_base_url}/user/get"
        params = {
            'access_token': access_token,
            'userid': userid,
        }
        
        try:
            response = requests.get(url, params=params, timeout=self.api_timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('errcode', 0) != 0:
                logger.error(f"获取用户详情失败: {data.get('errmsg')}")
                return None
            
            return data
            
        except Exception as e:
            logger.error(f"获取用户详情时发生错误: {e}")
            return None


# 全局用户服务实例
user_service = WeChatUserService()
