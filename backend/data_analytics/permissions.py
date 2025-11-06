"""
数据分析权限控制模块
"""
import logging
from typing import Dict, List, Optional, Any
from django.contrib.auth.models import User
from django.db.models import QuerySet
from base_data.models import BusinessRegion

logger = logging.getLogger(__name__)


class AnalyticsPermissionManager:
    """数据分析权限管理器"""
    
    def __init__(self, user: User):
        self.user = user
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
    
    def get_user_permissions(self) -> Dict[str, Any]:
        """
        获取用户的数据访问权限
        
        Returns:
            包含用户权限信息的字典
        """
        try:
            permissions = {
                'user_id': self.user.id,
                'is_superuser': self.user.is_superuser,
                'allowed_regions': [],
                'allowed_data_types': [],
                'data_level': 'basic',  # basic, advanced, full
            }
            
            # 超级用户拥有全部权限
            if self.user.is_superuser:
                permissions.update({
                    'allowed_regions': list(BusinessRegion.objects.values_list('id', flat=True)),
                    'allowed_data_types': ['all'],
                    'data_level': 'full',
                })
                return permissions
            
            # 根据用户部门和角色确定权限
            permissions.update(self._get_department_permissions())
            permissions.update(self._get_role_permissions())
            
            return permissions
            
        except Exception as e:
            self.logger.error(f"获取用户权限失败: {e}")
            # 返回最小权限
            return {
                'user_id': self.user.id,
                'is_superuser': False,
                'allowed_regions': [],
                'allowed_data_types': ['basic'],
                'data_level': 'basic',
            }
    
    def _get_department_permissions(self) -> Dict[str, Any]:
        """根据用户部门获取权限"""
        permissions = {
            'allowed_regions': [],
            'allowed_data_types': [],
        }
        
        try:
            # 检查用户是否有部门信息
            if not hasattr(self.user, 'department') or not self.user.department:
                return permissions
            
            department_name = self.user.department.name
            
            # 根据部门分配权限
            if department_name == '总裁办':
                # 总裁办可以查看所有数据
                permissions.update({
                    'allowed_regions': list(BusinessRegion.objects.values_list('id', flat=True)),
                    'allowed_data_types': ['all'],
                    'data_level': 'full',
                })
            
            elif department_name == '商务部':
                # 商务部可以查看拓店相关数据
                permissions.update({
                    'allowed_regions': self._get_user_managed_regions(),
                    'allowed_data_types': ['follow_up', 'store_planning', 'construction'],
                    'data_level': 'advanced',
                })
            
            elif department_name == '运营部':
                # 运营部可以查看运营相关数据
                permissions.update({
                    'allowed_regions': self._get_user_managed_regions(),
                    'allowed_data_types': ['store_operation', 'assets', 'reports'],
                    'data_level': 'advanced',
                })
            
            elif department_name == '财务部':
                # 财务部可以查看财务相关数据
                permissions.update({
                    'allowed_regions': list(BusinessRegion.objects.values_list('id', flat=True)),
                    'allowed_data_types': ['financial', 'roi', 'budget'],
                    'data_level': 'advanced',
                })
            
            elif department_name == 'IT部':
                # IT部可以查看系统监控数据
                permissions.update({
                    'allowed_regions': list(BusinessRegion.objects.values_list('id', flat=True)),
                    'allowed_data_types': ['system', 'monitoring'],
                    'data_level': 'basic',
                })
            
            else:
                # 其他部门基础权限
                permissions.update({
                    'allowed_regions': self._get_user_managed_regions(),
                    'allowed_data_types': ['basic'],
                    'data_level': 'basic',
                })
            
        except Exception as e:
            self.logger.error(f"获取部门权限失败: {e}")
        
        return permissions
    
    def _get_role_permissions(self) -> Dict[str, Any]:
        """根据用户角色获取权限"""
        permissions = {}
        
        try:
            # 检查用户角色
            user_groups = self.user.groups.all()
            
            for group in user_groups:
                if group.name == '系统管理员':
                    permissions.update({
                        'data_level': 'full',
                        'allowed_data_types': ['all'],
                    })
                    break
                
                elif group.name == '区域经理':
                    permissions.update({
                        'data_level': 'advanced',
                        'allowed_regions': self._get_user_managed_regions(),
                    })
                
                elif group.name == '门店经理':
                    permissions.update({
                        'data_level': 'basic',
                        'allowed_regions': self._get_user_managed_regions(),
                    })
        
        except Exception as e:
            self.logger.error(f"获取角色权限失败: {e}")
        
        return permissions
    
    def _get_user_managed_regions(self) -> List[int]:
        """获取用户管理的区域ID列表"""
        try:
            # 检查用户是否管理某些区域
            managed_regions = BusinessRegion.objects.filter(
                manager=self.user
            ).values_list('id', flat=True)
            
            return list(managed_regions)
            
        except Exception as e:
            self.logger.error(f"获取用户管理区域失败: {e}")
            return []
    
    def filter_data_by_permission(self, queryset: QuerySet, data_type: str) -> QuerySet:
        """
        根据用户权限过滤数据查询集
        
        Args:
            queryset: 原始查询集
            data_type: 数据类型
            
        Returns:
            过滤后的查询集
        """
        try:
            permissions = self.get_user_permissions()
            
            # 超级用户不需要过滤
            if permissions['is_superuser']:
                return queryset
            
            # 检查数据类型权限
            allowed_data_types = permissions.get('allowed_data_types', [])
            if 'all' not in allowed_data_types and data_type not in allowed_data_types:
                # 返回空查询集
                return queryset.none()
            
            # 根据区域权限过滤
            allowed_regions = permissions.get('allowed_regions', [])
            if allowed_regions:
                # 根据不同的模型类型应用区域过滤
                model_name = queryset.model.__name__
                
                if model_name == 'StoreProfile':
                    queryset = queryset.filter(business_region_id__in=allowed_regions)
                
                elif model_name == 'FollowUpRecord':
                    queryset = queryset.filter(location__business_region_id__in=allowed_regions)
                
                elif model_name == 'ConstructionOrder':
                    queryset = queryset.filter(
                        follow_up_record__location__business_region_id__in=allowed_regions
                    )
                
                elif model_name == 'StorePlan':
                    queryset = queryset.filter(
                        regional_plans__region_id__in=allowed_regions
                    ).distinct()
                
                elif model_name == 'RegionalPlan':
                    queryset = queryset.filter(region_id__in=allowed_regions)
            
            return queryset
            
        except Exception as e:
            self.logger.error(f"数据权限过滤失败: {e}")
            # 出错时返回空查询集，确保数据安全
            return queryset.none()
    
    def can_access_data_type(self, data_type: str) -> bool:
        """
        检查用户是否可以访问指定类型的数据
        
        Args:
            data_type: 数据类型
            
        Returns:
            是否有权限访问
        """
        try:
            permissions = self.get_user_permissions()
            
            if permissions['is_superuser']:
                return True
            
            allowed_data_types = permissions.get('allowed_data_types', [])
            return 'all' in allowed_data_types or data_type in allowed_data_types
            
        except Exception as e:
            self.logger.error(f"检查数据类型权限失败: {e}")
            return False
    
    def can_access_region(self, region_id: Optional[int]) -> bool:
        """
        检查用户是否可以访问指定区域的数据
        
        Args:
            region_id: 区域ID
            
        Returns:
            是否有权限访问
        """
        try:
            permissions = self.get_user_permissions()
            
            if permissions['is_superuser']:
                return True
            
            # 如果没有指定区域，允许访问
            if region_id is None:
                return True
            
            allowed_regions = permissions.get('allowed_regions', [])
            return region_id in allowed_regions
            
        except Exception as e:
            self.logger.error(f"检查区域权限失败: {e}")
            return False
    
    def can_generate_report(self, report_type: str) -> bool:
        """
        检查用户是否可以生成指定类型的报表
        
        Args:
            report_type: 报表类型 (plan, follow_up, preparation, assets)
            
        Returns:
            是否有权限生成报表
        """
        try:
            permissions = self.get_user_permissions()
            
            if permissions['is_superuser']:
                return True
            
            # 检查数据级别权限
            data_level = permissions.get('data_level', 'basic')
            if data_level == 'basic':
                # 基础级别用户不能生成报表
                return False
            
            # 检查具体报表类型权限
            allowed_data_types = permissions.get('allowed_data_types', [])
            
            if 'all' in allowed_data_types:
                return True
            
            # 根据报表类型检查权限
            report_permissions = {
                'plan': ['store_planning', 'all'],
                'follow_up': ['follow_up', 'all'],
                'preparation': ['construction', 'all'],
                'assets': ['store_operation', 'assets', 'all'],
            }
            
            required_permissions = report_permissions.get(report_type, [])
            return any(perm in allowed_data_types for perm in required_permissions)
            
        except Exception as e:
            self.logger.error(f"检查报表生成权限失败: {e}")
            return False
    
    def can_download_report(self, report_task) -> bool:
        """
        检查用户是否可以下载指定的报表
        
        Args:
            report_task: 报表任务对象
            
        Returns:
            是否有权限下载报表
        """
        try:
            # 只能下载自己创建的报表
            if report_task.created_by != self.user:
                return False
            
            # 检查报表类型权限
            return self.can_generate_report(report_task.report_type)
            
        except Exception as e:
            self.logger.error(f"检查报表下载权限失败: {e}")
            return False
    
    def can_access_external_data_api(self) -> bool:
        """
        检查用户是否可以访问外部数据接入API
        
        Returns:
            是否有权限访问外部数据API
        """
        try:
            permissions = self.get_user_permissions()
            
            if permissions['is_superuser']:
                return True
            
            # 检查用户是否有系统管理权限
            user_groups = self.user.groups.all()
            for group in user_groups:
                if group.name in ['系统管理员', 'API管理员']:
                    return True
            
            # 检查部门权限
            if hasattr(self.user, 'department') and self.user.department:
                if self.user.department.name in ['IT部', '总裁办']:
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"检查外部数据API权限失败: {e}")
            return False
    
    def sanitize_data(self, data: Dict, data_type: str) -> Dict:
        """
        根据用户权限对数据进行脱敏处理
        
        Args:
            data: 原始数据
            data_type: 数据类型
            
        Returns:
            脱敏后的数据
        """
        try:
            permissions = self.get_user_permissions()
            data_level = permissions.get('data_level', 'basic')
            
            # 全权限用户不需要脱敏
            if data_level == 'full':
                return data
            
            # 根据数据级别进行脱敏
            if data_level == 'basic':
                # 基础级别：隐藏敏感财务数据
                sensitive_fields = ['revenue', 'profit', 'cost', 'investment', 'roi']
                for field in sensitive_fields:
                    if field in data:
                        data[field] = '***'
            
            elif data_level == 'advanced':
                # 高级级别：部分脱敏
                if 'detailed_financial' in data:
                    data['detailed_financial'] = '***'
            
            return data
            
        except Exception as e:
            self.logger.error(f"数据脱敏失败: {e}")
            return data


def get_user_analytics_permissions(user: User) -> Dict[str, Any]:
    """
    获取用户的数据分析权限（便捷函数）
    
    Args:
        user: 用户对象
        
    Returns:
        权限信息字典
    """
    manager = AnalyticsPermissionManager(user)
    return manager.get_user_permissions()


def filter_analytics_data(user: User, queryset: QuerySet, data_type: str) -> QuerySet:
    """
    根据用户权限过滤分析数据（便捷函数）
    
    Args:
        user: 用户对象
        queryset: 查询集
        data_type: 数据类型
        
    Returns:
        过滤后的查询集
    """
    manager = AnalyticsPermissionManager(user)
    return manager.filter_data_by_permission(queryset, data_type)