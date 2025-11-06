"""
开店筹备管理模块序列化器
"""
from rest_framework import serializers
from .models import ConstructionOrder, Milestone, DeliveryChecklist


class MilestoneSerializer(serializers.ModelSerializer):
    """里程碑序列化器"""
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'construction_order', 'name', 'description',
            'planned_date', 'actual_date', 'status',
            'reminder_sent', 'remark',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'construction_order', 'reminder_sent', 'created_at', 'updated_at']
    
    def validate(self, data):
        """验证数据"""
        # 如果状态为已完成，必须填写实际完成日期
        if data.get('status') == Milestone.STATUS_COMPLETED and not data.get('actual_date'):
            raise serializers.ValidationError({
                'actual_date': '状态为已完成时，必须填写实际完成日期'
            })
        
        return data


class MilestoneListSerializer(serializers.ModelSerializer):
    """里程碑列表序列化器（简化版）"""
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'name', 'planned_date', 'actual_date',
            'status', 'reminder_sent'
        ]


class ConstructionOrderSerializer(serializers.ModelSerializer):
    """工程单序列化器"""
    
    # 关联数据
    follow_up_record_info = serializers.SerializerMethodField()
    supplier_info = serializers.SerializerMethodField()
    created_by_info = serializers.SerializerMethodField()
    milestones = MilestoneListSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConstructionOrder
        fields = [
            'id', 'order_no', 'store_name', 'follow_up_record',
            'follow_up_record_info', 'design_files',
            'construction_start_date', 'construction_end_date',
            'actual_end_date', 'supplier', 'supplier_info',
            'status', 'acceptance_date', 'acceptance_result',
            'acceptance_notes', 'rectification_items', 'remark',
            'milestones', 'created_by', 'created_by_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_no', 'follow_up_record_info',
            'supplier_info', 'created_by_info', 'milestones',
            'created_at', 'updated_at'
        ]
    
    def get_follow_up_record_info(self, obj):
        """获取跟进单信息"""
        if obj.follow_up_record:
            return {
                'id': obj.follow_up_record.id,
                'record_no': obj.follow_up_record.record_no,
                'location_name': obj.follow_up_record.location.name if obj.follow_up_record.location else None
            }
        return None
    
    def get_supplier_info(self, obj):
        """获取供应商信息"""
        if obj.supplier:
            return {
                'id': obj.supplier.id,
                'supplier_name': obj.supplier.name,
                'contact_person': obj.supplier.contact_person,
                'contact_phone': obj.supplier.contact_phone
            }
        return None
    
    def get_created_by_info(self, obj):
        """获取创建人信息"""
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'username': obj.created_by.username,
                'real_name': getattr(obj.created_by, 'real_name', obj.created_by.username)
            }
        return None
    
    def validate(self, data):
        """验证数据"""
        # 验证日期逻辑
        start_date = data.get('construction_start_date')
        end_date = data.get('construction_end_date')
        actual_end_date = data.get('actual_end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'construction_end_date': '预计完工日期不能早于开工日期'
            })
        
        if actual_end_date and start_date and actual_end_date < start_date:
            raise serializers.ValidationError({
                'actual_end_date': '实际完工日期不能早于开工日期'
            })
        
        # 验证验收结果
        if data.get('acceptance_result') == ConstructionOrder.ACCEPTANCE_PASSED:
            if not data.get('acceptance_date'):
                raise serializers.ValidationError({
                    'acceptance_date': '验收通过时必须填写验收日期'
                })
        
        return data


class ConstructionOrderListSerializer(serializers.ModelSerializer):
    """工程单列表序列化器（简化版）"""
    
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    milestone_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ConstructionOrder
        fields = [
            'id', 'order_no', 'store_name', 'supplier_name',
            'construction_start_date', 'construction_end_date',
            'status', 'acceptance_result', 'milestone_count',
            'created_by_name', 'created_at'
        ]
    
    def get_created_by_name(self, obj):
        """获取创建人姓名"""
        if obj.created_by:
            return getattr(obj.created_by, 'real_name', obj.created_by.username)
        return None
    
    def get_milestone_count(self, obj):
        """获取里程碑数量"""
        return obj.milestones.count()


class AcceptanceSerializer(serializers.Serializer):
    """验收操作序列化器"""
    
    acceptance_date = serializers.DateField(required=True, help_text='验收日期')
    acceptance_result = serializers.ChoiceField(
        choices=ConstructionOrder.ACCEPTANCE_CHOICES,
        required=True,
        help_text='验收结果'
    )
    acceptance_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='验收备注'
    )
    rectification_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text='整改项列表'
    )
    
    def validate(self, data):
        """验证数据"""
        # 如果验收不通过，必须填写整改项
        if data['acceptance_result'] == ConstructionOrder.ACCEPTANCE_FAILED:
            if not data.get('rectification_items'):
                raise serializers.ValidationError({
                    'rectification_items': '验收不通过时必须填写整改项'
                })
        
        return data


class RectificationSerializer(serializers.Serializer):
    """整改项序列化器"""
    
    rectification_items = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text='整改项列表'
    )
    
    def validate_rectification_items(self, value):
        """验证整改项"""
        if not value:
            raise serializers.ValidationError('整改项列表不能为空')
        
        # 验证每个整改项的必填字段
        for item in value:
            if 'description' not in item:
                raise serializers.ValidationError('整改项必须包含 description 字段')
            if 'status' not in item:
                raise serializers.ValidationError('整改项必须包含 status 字段')
        
        return value


class DesignFileUploadSerializer(serializers.Serializer):
    """设计图纸上传序列化器"""
    
    file_name = serializers.CharField(required=True, help_text='文件名')
    file_url = serializers.URLField(required=True, help_text='文件URL')
    file_size = serializers.IntegerField(required=False, help_text='文件大小（字节）')
    file_type = serializers.CharField(required=False, help_text='文件类型')
    upload_time = serializers.DateTimeField(required=False, help_text='上传时间')



class DeliveryChecklistSerializer(serializers.ModelSerializer):
    """交付清单序列化器"""
    
    # 关联数据
    construction_order_info = serializers.SerializerMethodField()
    created_by_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryChecklist
        fields = [
            'id', 'checklist_no', 'construction_order',
            'construction_order_info', 'store_name',
            'delivery_items', 'documents', 'status',
            'delivery_date', 'remark', 'created_by',
            'created_by_info', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'checklist_no', 'construction_order_info',
            'created_by_info', 'created_at', 'updated_at'
        ]
    
    def get_construction_order_info(self, obj):
        """获取工程单信息"""
        if obj.construction_order:
            return {
                'id': obj.construction_order.id,
                'order_no': obj.construction_order.order_no,
                'store_name': obj.construction_order.store_name,
                'status': obj.construction_order.status
            }
        return None
    
    def get_created_by_info(self, obj):
        """获取创建人信息"""
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'username': obj.created_by.username,
                'real_name': getattr(obj.created_by, 'real_name', obj.created_by.username)
            }
        return None
    
    def validate(self, data):
        """验证数据"""
        # 如果状态为已完成，必须填写交付日期
        if data.get('status') == DeliveryChecklist.STATUS_COMPLETED:
            if not data.get('delivery_date'):
                raise serializers.ValidationError({
                    'delivery_date': '状态为已完成时，必须填写交付日期'
                })
        
        return data


class DeliveryChecklistListSerializer(serializers.ModelSerializer):
    """交付清单列表序列化器（简化版）"""
    
    construction_order_no = serializers.CharField(
        source='construction_order.order_no',
        read_only=True
    )
    created_by_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryChecklist
        fields = [
            'id', 'checklist_no', 'store_name',
            'construction_order_no', 'status',
            'delivery_date', 'item_count', 'document_count',
            'created_by_name', 'created_at'
        ]
    
    def get_created_by_name(self, obj):
        """获取创建人姓名"""
        if obj.created_by:
            return getattr(obj.created_by, 'real_name', obj.created_by.username)
        return None
    
    def get_item_count(self, obj):
        """获取交付项数量"""
        return len(obj.delivery_items) if obj.delivery_items else 0
    
    def get_document_count(self, obj):
        """获取文档数量"""
        return len(obj.documents) if obj.documents else 0


class DocumentUploadSerializer(serializers.Serializer):
    """交付文档上传序列化器"""
    
    document_name = serializers.CharField(required=True, help_text='文档名称')
    document_url = serializers.URLField(required=True, help_text='文档URL')
    document_type = serializers.CharField(required=False, help_text='文档类型')
    file_size = serializers.IntegerField(required=False, help_text='文件大小（字节）')
    upload_time = serializers.DateTimeField(required=False, help_text='上传时间')
    description = serializers.CharField(required=False, allow_blank=True, help_text='描述')
