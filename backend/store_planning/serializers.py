from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from decimal import Decimal
from .models import (
    BusinessRegion, StoreType, StorePlan, RegionalPlan, 
    PlanExecutionLog, PlanApproval
)

User = get_user_model()


class BusinessRegionSerializer(serializers.ModelSerializer):
    """经营区域序列化器"""
    
    class Meta:
        model = BusinessRegion
        fields = [
            'id', 'name', 'code', 'description', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        """验证区域编码"""
        if not value.isalnum():
            raise serializers.ValidationError("区域编码只能包含字母和数字")
        return value.upper()  # 统一转换为大写

    def validate_name(self, value):
        """验证区域名称"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("区域名称至少需要2个字符")
        return value.strip()


class BusinessRegionListSerializer(serializers.ModelSerializer):
    """经营区域列表序列化器（简化版）"""
    
    class Meta:
        model = BusinessRegion
        fields = ['id', 'name', 'code', 'is_active']


class StoreTypeSerializer(serializers.ModelSerializer):
    """门店类型序列化器"""
    
    class Meta:
        model = StoreType
        fields = [
            'id', 'name', 'code', 'description', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        """验证类型编码"""
        if not value.isalnum():
            raise serializers.ValidationError("类型编码只能包含字母和数字")
        return value.upper()  # 统一转换为大写

    def validate_name(self, value):
        """验证类型名称"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("类型名称至少需要2个字符")
        return value.strip()


class StoreTypeListSerializer(serializers.ModelSerializer):
    """门店类型列表序列化器（简化版）"""
    
    class Meta:
        model = StoreType
        fields = ['id', 'name', 'code', 'is_active']


class RegionalPlanSerializer(serializers.ModelSerializer):
    """区域计划序列化器"""
    
    region_name = serializers.CharField(source='region.name', read_only=True)
    region_code = serializers.CharField(source='region.code', read_only=True)
    store_type_name = serializers.CharField(source='store_type.name', read_only=True)
    store_type_code = serializers.CharField(source='store_type.code', read_only=True)
    completion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = RegionalPlan
        fields = [
            'id', 'region', 'region_name', 'region_code',
            'store_type', 'store_type_name', 'store_type_code',
            'target_count', 'completed_count', 'completion_rate',
            'contribution_rate', 'budget_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completed_count', 'created_at', 'updated_at']

    def validate_target_count(self, value):
        """验证目标数量"""
        if value <= 0:
            raise serializers.ValidationError("目标数量必须大于0")
        return value

    def validate_contribution_rate(self, value):
        """验证贡献率"""
        if value is not None:
            if value < 0 or value > 100:
                raise serializers.ValidationError("贡献率必须在0-100之间")
        return value

    def validate_budget_amount(self, value):
        """验证预算金额"""
        if value < 0:
            raise serializers.ValidationError("预算金额不能为负数")
        return value


class RegionalPlanCreateSerializer(serializers.ModelSerializer):
    """区域计划创建序列化器（用于嵌套创建）"""
    
    class Meta:
        model = RegionalPlan
        fields = [
            'region', 'store_type', 'target_count', 
            'contribution_rate', 'budget_amount'
        ]

    def validate_target_count(self, value):
        """验证目标数量"""
        if value <= 0:
            raise serializers.ValidationError("目标数量必须大于0")
        return value

    def validate_contribution_rate(self, value):
        """验证贡献率"""
        if value is not None:
            if value < 0 or value > 100:
                raise serializers.ValidationError("贡献率必须在0-100之间")
        return value


class StorePlanSerializer(serializers.ModelSerializer):
    """开店计划序列化器"""
    
    regional_plans = RegionalPlanSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    completion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = StorePlan
        fields = [
            'id', 'name', 'plan_type', 'plan_type_display',
            'status', 'status_display', 'start_date', 'end_date',
            'description', 'total_target_count', 'total_completed_count',
            'completion_rate', 'total_budget_amount',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'published_at', 'cancelled_at', 'cancel_reason',
            'regional_plans'
        ]
        read_only_fields = [
            'id', 'total_target_count', 'total_completed_count',
            'created_by', 'created_at', 'updated_at',
            'published_at', 'cancelled_at'
        ]

    def validate(self, data):
        """整体数据验证"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': '结束日期必须晚于开始日期'
            })
        
        return data

    def validate_name(self, value):
        """验证计划名称"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("计划名称至少需要3个字符")
        return value.strip()


class StorePlanCreateSerializer(serializers.ModelSerializer):
    """开店计划创建序列化器"""
    
    regional_plans = RegionalPlanCreateSerializer(many=True, write_only=True)
    
    class Meta:
        model = StorePlan
        fields = [
            'name', 'plan_type', 'start_date', 'end_date',
            'description', 'regional_plans'
        ]

    def validate(self, data):
        """整体数据验证"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': '结束日期必须晚于开始日期'
            })
        
        # 验证区域计划数据
        regional_plans = data.get('regional_plans', [])
        if not regional_plans:
            raise serializers.ValidationError({
                'regional_plans': '至少需要添加一个区域计划'
            })
        
        # 验证区域和门店类型组合的唯一性
        region_store_combinations = set()
        total_contribution_rate = Decimal('0.00')
        
        for regional_plan in regional_plans:
            region_id = regional_plan['region'].id
            store_type_id = regional_plan['store_type'].id
            combination = (region_id, store_type_id)
            
            if combination in region_store_combinations:
                raise serializers.ValidationError({
                    'regional_plans': '同一区域和门店类型的组合不能重复'
                })
            region_store_combinations.add(combination)
            
            # 累计贡献率
            contribution_rate = regional_plan.get('contribution_rate')
            if contribution_rate is not None:
                total_contribution_rate += contribution_rate
        
        # 验证总贡献率不超过100%
        if total_contribution_rate > 100:
            raise serializers.ValidationError({
                'regional_plans': f'总贡献率不能超过100%，当前为{total_contribution_rate}%'
            })
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        """创建计划和区域计划"""
        regional_plans_data = validated_data.pop('regional_plans')
        
        # 创建主计划
        plan = StorePlan.objects.create(**validated_data)
        
        # 创建区域计划
        total_target_count = 0
        total_budget_amount = Decimal('0.00')
        
        for regional_plan_data in regional_plans_data:
            regional_plan = RegionalPlan.objects.create(
                plan=plan,
                **regional_plan_data
            )
            total_target_count += regional_plan.target_count
            total_budget_amount += regional_plan.budget_amount
        
        # 更新计划的汇总数据
        plan.total_target_count = total_target_count
        plan.total_budget_amount = total_budget_amount
        plan.save(update_fields=['total_target_count', 'total_budget_amount'])
        
        # 记录执行日志
        PlanExecutionLog.objects.create(
            plan=plan,
            action_type='plan_created',
            action_description=f'创建计划：{plan.name}',
            created_by=self.context['request'].user
        )
        
        return plan


class StorePlanUpdateSerializer(serializers.ModelSerializer):
    """开店计划更新序列化器"""
    
    regional_plans = RegionalPlanCreateSerializer(many=True, write_only=True, required=False)
    
    class Meta:
        model = StorePlan
        fields = [
            'name', 'plan_type', 'start_date', 'end_date',
            'description', 'regional_plans'
        ]

    def validate(self, data):
        """整体数据验证"""
        # 检查计划状态是否允许修改
        if self.instance.status not in ['draft']:
            raise serializers.ValidationError("只有草稿状态的计划才能修改")
        
        start_date = data.get('start_date', self.instance.start_date)
        end_date = data.get('end_date', self.instance.end_date)
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': '结束日期必须晚于开始日期'
            })
        
        # 如果提供了区域计划数据，进行验证
        regional_plans = data.get('regional_plans')
        if regional_plans is not None:
            if not regional_plans:
                raise serializers.ValidationError({
                    'regional_plans': '至少需要添加一个区域计划'
                })
            
            # 验证区域和门店类型组合的唯一性
            region_store_combinations = set()
            total_contribution_rate = Decimal('0.00')
            
            for regional_plan in regional_plans:
                region_id = regional_plan['region'].id
                store_type_id = regional_plan['store_type'].id
                combination = (region_id, store_type_id)
                
                if combination in region_store_combinations:
                    raise serializers.ValidationError({
                        'regional_plans': '同一区域和门店类型的组合不能重复'
                    })
                region_store_combinations.add(combination)
                
                # 累计贡献率
                contribution_rate = regional_plan.get('contribution_rate')
                if contribution_rate is not None:
                    total_contribution_rate += contribution_rate
            
            # 验证总贡献率不超过100%
            if total_contribution_rate > 100:
                raise serializers.ValidationError({
                    'regional_plans': f'总贡献率不能超过100%，当前为{total_contribution_rate}%'
                })
        
        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        """更新计划和区域计划"""
        regional_plans_data = validated_data.pop('regional_plans', None)
        
        # 更新主计划
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 如果提供了区域计划数据，则重新创建区域计划
        if regional_plans_data is not None:
            # 删除现有区域计划
            instance.regional_plans.all().delete()
            
            # 创建新的区域计划
            total_target_count = 0
            total_budget_amount = Decimal('0.00')
            
            for regional_plan_data in regional_plans_data:
                regional_plan = RegionalPlan.objects.create(
                    plan=instance,
                    **regional_plan_data
                )
                total_target_count += regional_plan.target_count
                total_budget_amount += regional_plan.budget_amount
            
            # 更新计划的汇总数据
            instance.total_target_count = total_target_count
            instance.total_budget_amount = total_budget_amount
            instance.save(update_fields=['total_target_count', 'total_budget_amount'])
        
        # 记录执行日志
        PlanExecutionLog.objects.create(
            plan=instance,
            action_type='plan_updated',
            action_description=f'更新计划：{instance.name}',
            created_by=self.context['request'].user
        )
        
        return instance


class StorePlanListSerializer(serializers.ModelSerializer):
    """开店计划列表序列化器（简化版）"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    completion_rate = serializers.ReadOnlyField()
    regional_count = serializers.IntegerField(source='regional_plans.count', read_only=True)
    
    class Meta:
        model = StorePlan
        fields = [
            'id', 'name', 'plan_type', 'plan_type_display',
            'status', 'status_display', 'start_date', 'end_date',
            'total_target_count', 'total_completed_count', 'completion_rate',
            'total_budget_amount', 'created_by_name', 'created_at',
            'regional_count'
        ]


class PlanExecutionLogSerializer(serializers.ModelSerializer):
    """计划执行记录序列化器"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    regional_plan_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PlanExecutionLog
        fields = [
            'id', 'action_type', 'action_type_display', 'action_description',
            'previous_count', 'current_count', 'store_id',
            'created_by_name', 'created_at', 'regional_plan_info'
        ]

    def get_regional_plan_info(self, obj):
        """获取区域计划信息"""
        if obj.regional_plan:
            return {
                'region_name': obj.regional_plan.region.name,
                'store_type_name': obj.regional_plan.store_type.name
            }
        return None


class PlanApprovalSerializer(serializers.ModelSerializer):
    """计划审批记录序列化器"""
    
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    approval_type_display = serializers.CharField(source='get_approval_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PlanApproval
        fields = [
            'id', 'approval_type', 'approval_type_display',
            'status', 'status_display', 'submitted_by_name',
            'submitted_at', 'approved_by_name', 'approved_at',
            'rejection_reason', 'approval_notes'
        ]
        read_only_fields = [
            'id', 'submitted_by', 'submitted_at', 
            'approved_by', 'approved_at'
        ]

class PlanImportSerializer(serializers.Serializer):
    """计划导入序列化器"""
    
    file = serializers.FileField(
        help_text='Excel文件，支持.xlsx和.xls格式'
    )
    
    def validate_file(self, value):
        """验证上传的文件"""
        # 检查文件扩展名
        allowed_extensions = ['.xlsx', '.xls']
        file_extension = value.name.lower().split('.')[-1]
        if f'.{file_extension}' not in allowed_extensions:
            raise serializers.ValidationError(
                f'不支持的文件格式，请上传Excel文件（{", ".join(allowed_extensions)}）'
            )
        
        # 检查文件大小（限制为10MB）
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f'文件大小不能超过{max_size // (1024 * 1024)}MB'
            )
        
        return value


class PlanExportSerializer(serializers.Serializer):
    """计划导出序列化器"""
    
    plan_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='要导出的计划ID列表，为空则导出所有计划'
    )
    
    start_date = serializers.DateField(
        required=False,
        help_text='开始日期过滤'
    )
    
    end_date = serializers.DateField(
        required=False,
        help_text='结束日期过滤'
    )
    
    plan_type = serializers.ChoiceField(
        choices=StorePlan.PLAN_TYPE_CHOICES,
        required=False,
        help_text='计划类型过滤'
    )
    
    status = serializers.ChoiceField(
        choices=StorePlan.STATUS_CHOICES,
        required=False,
        help_text='计划状态过滤'
    )
    
    def validate(self, data):
        """整体数据验证"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'end_date': '结束日期不能早于开始日期'
            })
        
        return data


class ImportResultSerializer(serializers.Serializer):
    """导入结果序列化器"""
    
    success = serializers.BooleanField(help_text='导入是否成功')
    total_processed = serializers.IntegerField(help_text='处理的总记录数')
    success_count = serializers.IntegerField(help_text='成功导入的记录数')
    error_count = serializers.IntegerField(help_text='失败的记录数')
    
    created_plans = serializers.ListField(
        child=serializers.DictField(),
        help_text='成功创建的计划列表'
    )
    
    errors = serializers.ListField(
        child=serializers.DictField(),
        help_text='错误信息列表'
    )
    
    warnings = serializers.ListField(
        child=serializers.DictField(),
        help_text='警告信息列表'
    )