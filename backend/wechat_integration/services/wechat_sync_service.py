"""
企业微信同步服务
"""
import logging
from typing import Dict, List, Optional, Tuple
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import WechatDepartment, WechatUser, WechatSyncLog
from system_management.models import Department, User
from .wechat_client import WechatClient, WechatAPIError


logger = logging.getLogger(__name__)
User = get_user_model()


class WechatSyncService:
    """企业微信同步服务"""
    
    def __init__(self):
        self.client = WechatClient()
    
    def sync_departments(self, triggered_by: Optional[User] = None) -> WechatSyncLog:
        """
        同步企业微信部门
        
        Args:
            triggered_by: 触发同步的用户
            
        Returns:
            WechatSyncLog: 同步日志
        """
        # 创建同步日志
        sync_log = WechatSyncLog.objects.create(
            sync_type='department',
            status='running',
            triggered_by=triggered_by
        )
        
        try:
            logger.info("开始同步企业微信部门")
            
            # 获取企业微信部门列表
            wechat_departments = self.client.get_department_list()
            sync_log.total_count = len(wechat_departments)
            sync_log.save()
            
            # 同步部门数据
            success_count, failed_count = self._sync_department_data(wechat_departments)
            
            # 更新同步日志
            sync_log.success_count = success_count
            sync_log.failed_count = failed_count
            sync_log.mark_completed('success')
            
            logger.info(f"部门同步完成: 成功 {success_count}, 失败 {failed_count}")
            
        except Exception as e:
            logger.error(f"部门同步失败: {e}")
            sync_log.mark_completed('failed', str(e))
        
        return sync_log
    
    def _sync_department_data(self, wechat_departments: List[Dict]) -> Tuple[int, int]:
        """
        同步部门数据到本地数据库
        
        Args:
            wechat_departments: 企业微信部门列表
            
        Returns:
            Tuple[int, int]: (成功数量, 失败数量)
        """
        success_count = 0
        failed_count = 0
        
        # 按部门ID排序，确保父部门先创建
        wechat_departments.sort(key=lambda x: x.get('id', 0))
        
        for dept_data in wechat_departments:
            try:
                with transaction.atomic():
                    self._sync_single_department(dept_data)
                    success_count += 1
                    
            except Exception as e:
                logger.error(f"同步部门失败 [{dept_data.get('id')}]: {e}")
                failed_count += 1
        
        return success_count, failed_count
    
    def _sync_single_department(self, dept_data: Dict) -> WechatDepartment:
        """
        同步单个部门
        
        Args:
            dept_data: 企业微信部门数据
            
        Returns:
            WechatDepartment: 同步后的部门记录
        """
        wechat_dept_id = dept_data['id']
        name = dept_data['name']
        parent_id = dept_data.get('parentid')
        order = dept_data.get('order', 0)
        
        # 获取或创建企业微信部门记录
        wechat_dept, created = WechatDepartment.objects.get_or_create(
            wechat_dept_id=wechat_dept_id,
            defaults={
                'name': name,
                'parent_id': parent_id,
                'order': order,
                'sync_status': 'pending'
            }
        )
        
        # 更新部门信息
        if not created:
            wechat_dept.name = name
            wechat_dept.parent_id = parent_id
            wechat_dept.order = order
            wechat_dept.save()
        
        # 同步到本地部门表
        self._sync_to_local_department(wechat_dept)
        
        # 更新同步状态
        wechat_dept.sync_status = 'synced'
        wechat_dept.last_sync_at = timezone.now()
        wechat_dept.save()
        
        return wechat_dept
    
    def _sync_to_local_department(self, wechat_dept: WechatDepartment):
        """
        将企业微信部门同步到本地部门表
        
        Args:
            wechat_dept: 企业微信部门记录
        """
        # 查找父部门
        parent_department = None
        if wechat_dept.parent_id:
            try:
                parent_wechat_dept = WechatDepartment.objects.get(
                    wechat_dept_id=wechat_dept.parent_id
                )
                parent_department = parent_wechat_dept.local_department
            except WechatDepartment.DoesNotExist:
                logger.warning(f"未找到父部门 {wechat_dept.parent_id}")
        
        # 获取或创建本地部门
        if wechat_dept.local_department:
            # 更新现有部门
            local_dept = wechat_dept.local_department
            local_dept.name = wechat_dept.name
            local_dept.parent = parent_department
            local_dept.order = wechat_dept.order
            local_dept.save()
        else:
            # 创建新部门
            local_dept = Department.objects.create(
                wechat_dept_id=wechat_dept.wechat_dept_id,
                name=wechat_dept.name,
                parent=parent_department,
                order=wechat_dept.order
            )
            wechat_dept.local_department = local_dept
            wechat_dept.save()
    
    def sync_users(self, triggered_by: Optional[User] = None) -> WechatSyncLog:
        """
        同步企业微信用户
        
        Args:
            triggered_by: 触发同步的用户
            
        Returns:
            WechatSyncLog: 同步日志
        """
        # 创建同步日志
        sync_log = WechatSyncLog.objects.create(
            sync_type='user',
            status='running',
            triggered_by=triggered_by
        )
        
        try:
            logger.info("开始同步企业微信用户")
            
            # 获取所有部门的用户
            all_users = []
            departments = WechatDepartment.objects.filter(sync_status='synced')
            
            for dept in departments:
                try:
                    users = self.client.get_user_list(dept.wechat_dept_id)
                    all_users.extend(users)
                except WechatAPIError as e:
                    logger.error(f"获取部门 {dept.wechat_dept_id} 用户失败: {e}")
            
            # 去重（用户可能在多个部门）
            unique_users = {}
            for user in all_users:
                user_id = user.get('userid')
                if user_id and user_id not in unique_users:
                    unique_users[user_id] = user
            
            sync_log.total_count = len(unique_users)
            sync_log.save()
            
            # 同步用户数据
            success_count, failed_count = self._sync_user_data(list(unique_users.values()))
            
            # 更新同步日志
            sync_log.success_count = success_count
            sync_log.failed_count = failed_count
            sync_log.mark_completed('success')
            
            logger.info(f"用户同步完成: 成功 {success_count}, 失败 {failed_count}")
            
        except Exception as e:
            logger.error(f"用户同步失败: {e}")
            sync_log.mark_completed('failed', str(e))
        
        return sync_log
    
    def _sync_user_data(self, wechat_users: List[Dict]) -> Tuple[int, int]:
        """
        同步用户数据到本地数据库
        
        Args:
            wechat_users: 企业微信用户列表
            
        Returns:
            Tuple[int, int]: (成功数量, 失败数量)
        """
        success_count = 0
        failed_count = 0
        
        for user_data in wechat_users:
            try:
                with transaction.atomic():
                    self._sync_single_user(user_data)
                    success_count += 1
                    
            except Exception as e:
                logger.error(f"同步用户失败 [{user_data.get('userid')}]: {e}")
                failed_count += 1
        
        return success_count, failed_count
    
    def _sync_single_user(self, user_data: Dict) -> WechatUser:
        """
        同步单个用户
        
        Args:
            user_data: 企业微信用户数据
            
        Returns:
            WechatUser: 同步后的用户记录
        """
        wechat_user_id = user_data['userid']
        name = user_data.get('name', '')
        mobile = user_data.get('mobile', '')
        department_ids = user_data.get('department', [])
        position = user_data.get('position', '')
        gender = str(user_data.get('gender', 0))
        email = user_data.get('email', '')
        avatar = user_data.get('avatar', '')
        status = user_data.get('status', 1)
        
        # 获取或创建企业微信用户记录
        wechat_user, created = WechatUser.objects.get_or_create(
            wechat_user_id=wechat_user_id,
            defaults={
                'name': name,
                'mobile': mobile,
                'department_ids': department_ids,
                'position': position,
                'gender': gender,
                'email': email,
                'avatar': avatar,
                'status': status,
                'sync_status': 'pending'
            }
        )
        
        # 更新用户信息
        if not created:
            wechat_user.name = name
            wechat_user.mobile = mobile
            wechat_user.department_ids = department_ids
            wechat_user.position = position
            wechat_user.gender = gender
            wechat_user.email = email
            wechat_user.avatar = avatar
            wechat_user.status = status
            wechat_user.save()
        
        # 同步到本地用户表
        self._sync_to_local_user(wechat_user)
        
        # 更新同步状态
        wechat_user.sync_status = 'synced'
        wechat_user.last_sync_at = timezone.now()
        wechat_user.save()
        
        return wechat_user
    
    def _sync_to_local_user(self, wechat_user: WechatUser):
        """
        将企业微信用户同步到本地用户表
        
        Args:
            wechat_user: 企业微信用户记录
        """
        # 确定用户所属部门（取第一个部门）
        department = None
        if wechat_user.department_ids:
            try:
                wechat_dept = WechatDepartment.objects.get(
                    wechat_dept_id=wechat_user.department_ids[0]
                )
                department = wechat_dept.local_department
            except WechatDepartment.DoesNotExist:
                logger.warning(f"未找到部门 {wechat_user.department_ids[0]}")
        
        # 获取或创建本地用户
        if wechat_user.local_user:
            # 更新现有用户
            local_user = wechat_user.local_user
            local_user.first_name = wechat_user.name
            local_user.phone = wechat_user.mobile
            local_user.email = wechat_user.email
            local_user.department = department
            local_user.position = wechat_user.position
            local_user.is_active = wechat_user.status == 1  # 1表示已激活
            local_user.save()
        else:
            # 检查是否已存在相同手机号或企微ID的用户
            existing_user = None
            if wechat_user.mobile:
                try:
                    existing_user = User.objects.get(phone=wechat_user.mobile)
                except User.DoesNotExist:
                    pass
            
            if not existing_user:
                try:
                    existing_user = User.objects.get(wechat_user_id=wechat_user.wechat_user_id)
                except User.DoesNotExist:
                    pass
            
            if existing_user:
                # 关联现有用户
                existing_user.wechat_user_id = wechat_user.wechat_user_id
                existing_user.first_name = wechat_user.name
                existing_user.phone = wechat_user.mobile
                existing_user.email = wechat_user.email
                existing_user.department = department
                existing_user.position = wechat_user.position
                existing_user.is_active = wechat_user.status == 1
                existing_user.save()
                
                wechat_user.local_user = existing_user
                wechat_user.save()
            else:
                # 创建新用户
                username = wechat_user.wechat_user_id
                local_user = User.objects.create(
                    username=username,
                    wechat_user_id=wechat_user.wechat_user_id,
                    first_name=wechat_user.name,
                    phone=wechat_user.mobile,
                    email=wechat_user.email,
                    department=department,
                    position=wechat_user.position,
                    is_active=wechat_user.status == 1
                )
                
                wechat_user.local_user = local_user
                wechat_user.save()
    
    def sync_all(self, triggered_by: Optional[User] = None) -> WechatSyncLog:
        """
        全量同步（部门 + 用户）
        
        Args:
            triggered_by: 触发同步的用户
            
        Returns:
            WechatSyncLog: 同步日志
        """
        # 创建全量同步日志
        sync_log = WechatSyncLog.objects.create(
            sync_type='full',
            status='running',
            triggered_by=triggered_by
        )
        
        try:
            logger.info("开始全量同步企业微信数据")
            
            # 先同步部门
            dept_log = self.sync_departments(triggered_by)
            
            # 再同步用户
            user_log = self.sync_users(triggered_by)
            
            # 汇总结果
            total_count = dept_log.total_count + user_log.total_count
            success_count = dept_log.success_count + user_log.success_count
            failed_count = dept_log.failed_count + user_log.failed_count
            
            sync_log.total_count = total_count
            sync_log.success_count = success_count
            sync_log.failed_count = failed_count
            
            # 检查是否有失败
            if failed_count > 0:
                sync_log.mark_completed('failed', f"部分同步失败: 部门失败 {dept_log.failed_count}, 用户失败 {user_log.failed_count}")
            else:
                sync_log.mark_completed('success')
            
            logger.info(f"全量同步完成: 总计 {total_count}, 成功 {success_count}, 失败 {failed_count}")
            
        except Exception as e:
            logger.error(f"全量同步失败: {e}")
            sync_log.mark_completed('failed', str(e))
        
        return sync_log