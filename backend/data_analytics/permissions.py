"""
数据分析模块权限控制
"""
from rest_framework.permissions import BasePermission
from django.core.exceptions import PermissionDenied


class AnalyticsPermission(BasePermission):
    """数据分析权限控制"""
    
    def has_permission(self, request, view):
        """检查用户是否有数据分析权限"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 超级用户拥有所有权限
        if request.user.is_superuser:
            return True
        
        # 检查用户是否有数据分析相关权限
        # TODO: 根据具体的权限系统实现权限检查
        # 这里先简单检查用户是否属于有权限的部门
        allowed_departments = ['总裁办', '商务部', '运营部', '财务部', 'IT部']
        
        if hasattr(request.user, 'department') and request.user.department:
            if request.user.department.name in allowed_departments:
                return True
        
        # 检查用户角色权限
        if hasattr(request.user, 'roles'):
            user_roles = request.user.roles.all()
            for role in user_roles:
                # 检查角色是否有数据分析权限
                if role.permissions.filter(codename__contains='analytics').exists():
                    return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """检查用户是否有特定对象的权限"""
        if not self.has_permission(request, view):
            return False
        
        # 对于报表任务，只能访问自己创建的任务
        if hasattr(obj, 'created_by'):
            if obj.created_by != request.user and not request.user.is_superuser:
                return False
        
        return True


class DataAccessPermission:
    """数据访问权限控制工具类"""
    
    @staticmethod
    def filter_data_by_permission(user, queryset):
        """根据用户权限过滤数据"""
        if user.is_superuser:
            return queryset
        
        # 根据用户的区域权限过滤数据
        if hasattr(user, 'region_permissions'):
            allowed_regions = user.region_permissions.all()
            if allowed_regions.exists():
                # 假设queryset有region字段或相关字段
                if hasattr(queryset.model, 'region'):
                    queryset = queryset.filter(region__in=allowed_regions)
                elif hasattr(queryset.model, 'store') and hasattr(queryset.model.store, 'region'):
                    queryset = queryset.filter(store__region__in=allowed_regions)
        
        # 根据用户的部门权限过滤数据
        if hasattr(user, 'department') and user.department:
            department_name = user.department.name
            
            # 商务部只能看拓店相关数据
            if department_name == '商务部':
                # 根据具体的数据模型调整过滤条件
                pass
            
            # 运营部只能看运营相关数据
            elif department_name == '运营部':
                # 根据具体的数据模型调整过滤条件
                pass
        
        return queryset
    
    @staticmethod
    def check_report_permission(user, report_type):
        """检查用户是否有生成特定类型报表的权限"""
        if user.is_superuser:
            return True
        
        # 根据部门和报表类型检查权限
        if hasattr(user, 'department') and user.department:
            department_name = user.department.name
            
            # 定义各部门可以生成的报表类型
            department_reports = {
                '总裁办': ['plan', 'follow_up', 'preparation', 'assets'],
                '商务部': ['follow_up', 'preparation'],
                '运营部': ['plan', 'assets'],
                '财务部': ['assets'],
                'IT部': ['assets'],
            }
            
            allowed_reports = department_reports.get(department_name, [])
            return report_type in allowed_reports
        
        return False
    
    @staticmethod
    def sanitize_sensitive_data(user, data):
        """对敏感数据进行脱敏处理"""
        if user.is_superuser:
            return data
        
        # 根据用户权限对敏感数据进行脱敏
        if hasattr(user, 'department') and user.department:
            department_name = user.department.name
            
            # 非财务部门不能看到具体的收入数据
            if department_name != '财务部' and department_name != '总裁办':
                if isinstance(data, dict):
                    sensitive_fields = ['revenue', 'daily_revenue', 'monthly_revenue', 'investment_amount']
                    for field in sensitive_fields:
                        if field in data:
                            data[field] = '***'
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            for field in ['revenue', 'daily_revenue', 'monthly_revenue', 'investment_amount']:
                                if field in item:
                                    item[field] = '***'
        
        return data