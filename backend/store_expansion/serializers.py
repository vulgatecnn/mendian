"""
拓店管理模块序列化器
"""
from rest_framework import serializers
from .models import CandidateLocation, FollowUpRecord, ProfitCalculation


class CandidateLocationSerializer(serializers.ModelSerializer):
    """候选点位序列化器"""
    
    business_region_name = serializers.CharField(
        source='business_region.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.name',
        read_only=True
    )
    
    class Meta:
        model = CandidateLocation
        fields = [
            'id',
            'name',
            'province',
            'city',
            'district',
            'address',
            'area',
            'rent',
            'business_region',
            'business_region_name',
            'status',
            'remark',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """验证数据"""
        # 验证面积必须大于0
        if 'area' in attrs and attrs['area'] <= 0:
            raise serializers.ValidationError({'area': '面积必须大于0'})
        
        # 验证租金必须大于等于0
        if 'rent' in attrs and attrs['rent'] < 0:
            raise serializers.ValidationError({'rent': '租金不能为负数'})
        
        return attrs


class ProfitCalculationSerializer(serializers.ModelSerializer):
    """盈利测算序列化器"""
    
    class Meta:
        model = ProfitCalculation
        fields = [
            'id',
            'rent_cost',
            'decoration_cost',
            'equipment_cost',
            'other_cost',
            'daily_sales',
            'monthly_sales',
            'total_investment',
            'roi',
            'payback_period',
            'contribution_rate',
            'formula_version',
            'calculation_params',
            'calculated_at',
        ]
        read_only_fields = [
            'id',
            'total_investment',
            'roi',
            'payback_period',
            'contribution_rate',
            'formula_version',
            'calculation_params',
            'calculated_at',
        ]


class FollowUpRecordSerializer(serializers.ModelSerializer):
    """铺位跟进单序列化器"""
    
    location_name = serializers.CharField(
        source='location.name',
        read_only=True
    )
    location_address = serializers.SerializerMethodField()
    business_region_name = serializers.CharField(
        source='location.business_region.name',
        read_only=True
    )
    legal_entity_name = serializers.CharField(
        source='legal_entity.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.name',
        read_only=True
    )
    profit_calculation_detail = ProfitCalculationSerializer(
        source='profit_calculation',
        read_only=True
    )
    
    class Meta:
        model = FollowUpRecord
        fields = [
            'id',
            'record_no',
            'location',
            'location_name',
            'location_address',
            'business_region_name',
            'status',
            'priority',
            'survey_data',
            'survey_date',
            'business_terms',
            'profit_calculation',
            'profit_calculation_detail',
            'contract_info',
            'contract_date',
            'contract_reminders',
            'legal_entity',
            'legal_entity_name',
            'is_abandoned',
            'abandon_reason',
            'abandon_date',
            'remark',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'record_no',
            'created_by',
            'created_at',
            'updated_at',
        ]
    
    def get_location_address(self, obj):
        """获取点位完整地址"""
        return f"{obj.location.city}{obj.location.district}{obj.location.address}"
    
    def validate(self, attrs):
        """验证数据"""
        # 如果设置为已放弃，必须提供放弃原因
        if attrs.get('is_abandoned') and not attrs.get('abandon_reason'):
            raise serializers.ValidationError({
                'abandon_reason': '放弃跟进时必须提供放弃原因'
            })
        
        return attrs


class FollowUpRecordListSerializer(serializers.ModelSerializer):
    """铺位跟进单列表序列化器（简化版）"""
    
    location_name = serializers.CharField(
        source='location.name',
        read_only=True
    )
    location_city = serializers.CharField(
        source='location.city',
        read_only=True
    )
    location_district = serializers.CharField(
        source='location.district',
        read_only=True
    )
    business_region_name = serializers.CharField(
        source='location.business_region.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.name',
        read_only=True
    )
    
    # 盈利测算关键指标
    roi = serializers.DecimalField(
        source='profit_calculation.roi',
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )
    contribution_rate = serializers.DecimalField(
        source='profit_calculation.contribution_rate',
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = FollowUpRecord
        fields = [
            'id',
            'record_no',
            'location',
            'location_name',
            'location_city',
            'location_district',
            'business_region_name',
            'status',
            'priority',
            'survey_date',
            'contract_date',
            'roi',
            'contribution_rate',
            'is_abandoned',
            'created_by_name',
            'created_at',
        ]


class SurveyDataSerializer(serializers.Serializer):
    """调研信息序列化器"""
    
    survey_date = serializers.DateField(required=True, help_text='调研日期')
    survey_data = serializers.JSONField(required=True, help_text='调研数据')


class BusinessTermsSerializer(serializers.Serializer):
    """商务条件序列化器"""
    
    rent_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True,
        help_text='租金成本'
    )
    decoration_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True,
        help_text='装修成本'
    )
    equipment_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True,
        help_text='设备成本'
    )
    other_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        default=0,
        help_text='其他成本'
    )


class SalesForecastSerializer(serializers.Serializer):
    """销售预测序列化器"""
    
    daily_sales = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True,
        help_text='日均销售额'
    )
    monthly_sales = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True,
        help_text='月均销售额'
    )


class ProfitCalculationRequestSerializer(serializers.Serializer):
    """盈利测算请求序列化器"""
    
    business_terms = BusinessTermsSerializer(required=True, help_text='商务条件')
    sales_forecast = SalesForecastSerializer(required=True, help_text='销售预测')


class ContractInfoSerializer(serializers.Serializer):
    """签约信息序列化器"""
    
    contract_date = serializers.DateField(required=True, help_text='签约日期')
    contract_info = serializers.JSONField(required=True, help_text='合同信息')
    contract_reminders = serializers.JSONField(
        required=False,
        default=list,
        help_text='合同提醒配置'
    )
    legal_entity = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='法人主体ID'
    )


class AbandonFollowUpSerializer(serializers.Serializer):
    """放弃跟进序列化器"""
    
    abandon_reason = serializers.CharField(
        required=True,
        max_length=500,
        help_text='放弃原因'
    )
