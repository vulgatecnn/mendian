"""
基础数据管理序列化器
"""
from rest_framework import serializers
from .models import BusinessRegion, Supplier, LegalEntity, Customer, Budget


class BusinessRegionSerializer(serializers.ModelSerializer):
    """业务大区序列化器"""
    
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = BusinessRegion
        fields = [
            'id', 'name', 'code', 'description', 'provinces',
            'manager', 'manager_name', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证大区编码唯一性"""
        instance = self.instance
        if instance:
            # 更新时排除自身
            if BusinessRegion.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError('该大区编码已存在')
        else:
            # 创建时检查
            if BusinessRegion.objects.filter(code=value).exists():
                raise serializers.ValidationError('该大区编码已存在')
        return value


class SupplierSerializer(serializers.ModelSerializer):
    """供应商序列化器"""
    
    supplier_type_display = serializers.CharField(source='get_supplier_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'code', 'supplier_type', 'supplier_type_display',
            'contact_person', 'contact_phone', 'contact_email', 'address',
            'credit_code', 'legal_representative',
            'status', 'status_display', 'remark',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证供应商编码唯一性"""
        instance = self.instance
        if instance:
            if Supplier.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError('该供应商编码已存在')
        else:
            if Supplier.objects.filter(code=value).exists():
                raise serializers.ValidationError('该供应商编码已存在')
        return value


class LegalEntitySerializer(serializers.ModelSerializer):
    """法人主体序列化器"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = LegalEntity
        fields = [
            'id', 'name', 'code', 'credit_code', 'legal_representative',
            'registered_capital', 'registration_date',
            'contact_person', 'contact_phone', 'contact_email',
            'registered_address', 'business_address',
            'status', 'status_display', 'remark',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证主体编码唯一性"""
        instance = self.instance
        if instance:
            if LegalEntity.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError('该主体编码已存在')
        else:
            if LegalEntity.objects.filter(code=value).exists():
                raise serializers.ValidationError('该主体编码已存在')
        return value
    
    def validate_credit_code(self, value):
        """验证统一社会信用代码唯一性"""
        instance = self.instance
        if instance:
            if LegalEntity.objects.exclude(pk=instance.pk).filter(credit_code=value).exists():
                raise serializers.ValidationError('该统一社会信用代码已存在')
        else:
            if LegalEntity.objects.filter(credit_code=value).exists():
                raise serializers.ValidationError('该统一社会信用代码已存在')
        return value


class CustomerSerializer(serializers.ModelSerializer):
    """客户序列化器"""
    
    customer_type_display = serializers.CharField(source='get_customer_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'code', 'customer_type', 'customer_type_display',
            'contact_person', 'contact_phone', 'contact_email', 'address',
            'credit_code', 'legal_representative',
            'cooperation_start_date', 'cooperation_end_date',
            'status', 'status_display', 'remark',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证客户编码唯一性"""
        instance = self.instance
        if instance:
            if Customer.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError('该客户编码已存在')
        else:
            if Customer.objects.filter(code=value).exists():
                raise serializers.ValidationError('该客户编码已存在')
        return value


class BudgetSerializer(serializers.ModelSerializer):
    """商务预算序列化器"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    business_region_name = serializers.CharField(source='business_region.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'code', 'total_amount', 'budget_items',
            'business_region', 'business_region_name',
            'valid_from', 'valid_to',
            'status', 'status_display', 'remark',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证预算编码唯一性"""
        instance = self.instance
        if instance:
            if Budget.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError('该预算编码已存在')
        else:
            if Budget.objects.filter(code=value).exists():
                raise serializers.ValidationError('该预算编码已存在')
        return value
    
    def validate(self, attrs):
        """验证有效期"""
        valid_from = attrs.get('valid_from')
        valid_to = attrs.get('valid_to')
        
        if valid_from and valid_to and valid_to < valid_from:
            raise serializers.ValidationError({'valid_to': '失效日期不能早于生效日期'})
        
        return attrs
