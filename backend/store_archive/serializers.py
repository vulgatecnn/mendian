"""
门店档案模块 - 序列化器
"""
from rest_framework import serializers
from store_archive.models import StoreProfile
from base_data.serializers import BusinessRegionSerializer
from system_management.serializers import UserSimpleSerializer


class StoreProfileListSerializer(serializers.ModelSerializer):
    """门店档案列表序列化器"""
    
    business_region_name = serializers.CharField(
        source='business_region.region_name',
        read_only=True
    )
    store_type_display = serializers.CharField(
        source='get_store_type_display',
        read_only=True
    )
    operation_mode_display = serializers.CharField(
        source='get_operation_mode_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    store_manager_name = serializers.CharField(
        source='store_manager.real_name',
        read_only=True,
        allow_null=True
    )
    business_manager_name = serializers.CharField(
        source='business_manager.real_name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = StoreProfile
        fields = [
            'id',
            'store_code',
            'store_name',
            'province',
            'city',
            'district',
            'address',
            'business_region',
            'business_region_name',
            'store_type',
            'store_type_display',
            'operation_mode',
            'operation_mode_display',
            'status',
            'status_display',
            'opening_date',
            'closing_date',
            'store_manager',
            'store_manager_name',
            'business_manager',
            'business_manager_name',
            'created_at',
            'updated_at',
        ]


class StoreProfileDetailSerializer(serializers.ModelSerializer):
    """门店档案详情序列化器"""
    
    business_region_detail = BusinessRegionSerializer(
        source='business_region',
        read_only=True
    )
    store_manager_detail = UserSimpleSerializer(
        source='store_manager',
        read_only=True
    )
    business_manager_detail = UserSimpleSerializer(
        source='business_manager',
        read_only=True
    )
    created_by_detail = UserSimpleSerializer(
        source='created_by',
        read_only=True
    )
    store_type_display = serializers.CharField(
        source='get_store_type_display',
        read_only=True
    )
    operation_mode_display = serializers.CharField(
        source='get_operation_mode_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = StoreProfile
        fields = [
            'id',
            'store_code',
            'store_name',
            'province',
            'city',
            'district',
            'address',
            'business_region',
            'business_region_detail',
            'store_type',
            'store_type_display',
            'operation_mode',
            'operation_mode_display',
            'status',
            'status_display',
            'opening_date',
            'closing_date',
            'store_manager',
            'store_manager_detail',
            'business_manager',
            'business_manager_detail',
            'follow_up_record',
            'construction_order',
            'remarks',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        ]


class StoreProfileCreateUpdateSerializer(serializers.ModelSerializer):
    """门店档案创建/更新序列化器"""
    
    class Meta:
        model = StoreProfile
        fields = [
            'store_code',
            'store_name',
            'province',
            'city',
            'district',
            'address',
            'business_region',
            'store_type',
            'operation_mode',
            'status',
            'opening_date',
            'closing_date',
            'store_manager',
            'business_manager',
            'follow_up_record',
            'construction_order',
            'remarks',
        ]
    
    def validate_store_code(self, value):
        """验证门店编码唯一性"""
        instance = self.instance
        if instance:
            # 更新时，排除当前实例
            if StoreProfile.objects.exclude(id=instance.id).filter(store_code=value).exists():
                raise serializers.ValidationError("门店编码已存在")
        else:
            # 创建时
            if StoreProfile.objects.filter(store_code=value).exists():
                raise serializers.ValidationError("门店编码已存在")
        return value
    
    def validate(self, attrs):
        """验证数据"""
        # 验证开业日期和闭店日期
        opening_date = attrs.get('opening_date')
        closing_date = attrs.get('closing_date')
        
        if opening_date and closing_date and closing_date < opening_date:
            raise serializers.ValidationError({
                'closing_date': '闭店日期不能早于开业日期'
            })
        
        return attrs
    
    def create(self, validated_data):
        """创建门店档案"""
        # 设置创建人
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
