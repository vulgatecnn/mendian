"""
门店档案聚合服务
"""
from django.db.models import Prefetch
from store_archive.models import StoreProfile


class StoreArchiveService:
    """门店档案聚合服务"""
    
    @staticmethod
    def get_store_full_info(store_id):
        """
        获取门店完整档案信息
        
        Args:
            store_id: 门店ID
            
        Returns:
            dict: 包含门店基本信息、跟进历史、工程历史的完整数据
        """
        try:
            # 查询门店档案，预加载关联数据
            store = StoreProfile.objects.select_related(
                'business_region',
                'store_manager',
                'business_manager',
                'follow_up_record',
                'follow_up_record__location',
                'follow_up_record__legal_entity',
                'follow_up_record__profit_calculation',
                'construction_order',
                'construction_order__supplier',
                'created_by'
            ).prefetch_related(
                'construction_order__milestones'
            ).get(id=store_id)
            
            # 基本信息
            basic_info = StoreArchiveService._get_basic_info(store)
            
            # 跟进历史（商务条件、签约信息）
            follow_up_info = StoreArchiveService._get_follow_up_info(store.follow_up_record)
            
            # 工程历史（设计图纸、交接资料）
            construction_info = StoreArchiveService._get_construction_info(store.construction_order)
            
            return {
                'basic_info': basic_info,
                'follow_up_info': follow_up_info,
                'construction_info': construction_info
            }
        except StoreProfile.DoesNotExist:
            raise ValueError(f"门店档案不存在: {store_id}")
    
    @staticmethod
    def _get_basic_info(store):
        """获取门店基本信息"""
        return {
            'id': store.id,
            'store_code': store.store_code,
            'store_name': store.store_name,
            'province': store.province,
            'city': store.city,
            'district': store.district,
            'address': store.address,
            'business_region': {
                'id': store.business_region.id,
                'region_code': store.business_region.region_code,
                'region_name': store.business_region.region_name,
            } if store.business_region else None,
            'store_type': store.store_type,
            'store_type_display': store.get_store_type_display(),
            'operation_mode': store.operation_mode,
            'operation_mode_display': store.get_operation_mode_display(),
            'status': store.status,
            'status_display': store.get_status_display(),
            'opening_date': store.opening_date.isoformat() if store.opening_date else None,
            'closing_date': store.closing_date.isoformat() if store.closing_date else None,
            'store_manager': {
                'id': store.store_manager.id,
                'real_name': store.store_manager.real_name,
                'phone': store.store_manager.phone,
            } if store.store_manager else None,
            'business_manager': {
                'id': store.business_manager.id,
                'real_name': store.business_manager.real_name,
                'phone': store.business_manager.phone,
            } if store.business_manager else None,
            'remarks': store.remarks,
            'created_by': {
                'id': store.created_by.id,
                'real_name': store.created_by.real_name,
            } if store.created_by else None,
            'created_at': store.created_at.isoformat(),
            'updated_at': store.updated_at.isoformat(),
        }
    
    @staticmethod
    def _get_follow_up_info(follow_up_record):
        """获取跟进单信息"""
        if not follow_up_record:
            return None
        
        return {
            'id': follow_up_record.id,
            'record_no': follow_up_record.record_no,
            'status': follow_up_record.status,
            'status_display': follow_up_record.get_status_display(),
            'priority': follow_up_record.priority,
            'priority_display': follow_up_record.get_priority_display(),
            
            # 候选点位信息
            'location': {
                'id': follow_up_record.location.id,
                'name': follow_up_record.location.name,
                'address': follow_up_record.location.address,
                'area': float(follow_up_record.location.area),
                'rent': float(follow_up_record.location.rent),
            } if follow_up_record.location else None,
            
            # 调研信息
            'survey_data': follow_up_record.survey_data,
            'survey_date': follow_up_record.survey_date.isoformat() if follow_up_record.survey_date else None,
            
            # 商务条件
            'business_terms': follow_up_record.business_terms,
            
            # 盈利测算
            'profit_calculation': {
                'id': follow_up_record.profit_calculation.id,
                'total_investment': float(follow_up_record.profit_calculation.total_investment),
                'roi': float(follow_up_record.profit_calculation.roi),
                'payback_period': follow_up_record.profit_calculation.payback_period,
                'contribution_rate': float(follow_up_record.profit_calculation.contribution_rate),
                'monthly_sales': float(follow_up_record.profit_calculation.monthly_sales),
                'calculated_at': follow_up_record.profit_calculation.calculated_at.isoformat(),
            } if follow_up_record.profit_calculation else None,
            
            # 签约信息
            'contract_info': follow_up_record.contract_info,
            'contract_date': follow_up_record.contract_date.isoformat() if follow_up_record.contract_date else None,
            'contract_reminders': follow_up_record.contract_reminders,
            
            # 法人主体
            'legal_entity': {
                'id': follow_up_record.legal_entity.id,
                'entity_code': follow_up_record.legal_entity.entity_code,
                'entity_name': follow_up_record.legal_entity.entity_name,
                'unified_social_credit_code': follow_up_record.legal_entity.unified_social_credit_code,
            } if follow_up_record.legal_entity else None,
            
            'created_at': follow_up_record.created_at.isoformat(),
        }
    
    @staticmethod
    def _get_construction_info(construction_order):
        """获取工程单信息"""
        if not construction_order:
            return None
        
        # 获取里程碑列表
        milestones = []
        if hasattr(construction_order, 'milestones'):
            milestones = [
                {
                    'id': m.id,
                    'name': m.name,
                    'planned_date': m.planned_date.isoformat(),
                    'actual_date': m.actual_date.isoformat() if m.actual_date else None,
                    'status': m.status,
                    'status_display': m.get_status_display(),
                    'reminder_sent': m.reminder_sent,
                }
                for m in construction_order.milestones.all()
            ]
        
        # 获取交付清单
        delivery_checklist = None
        if hasattr(construction_order, 'deliverychecklist'):
            dc = construction_order.deliverychecklist
            delivery_checklist = {
                'id': dc.id,
                'checklist_no': dc.checklist_no,
                'delivery_items': dc.delivery_items,
                'documents': dc.documents,
                'status': dc.status,
                'status_display': dc.get_status_display(),
                'delivery_date': dc.delivery_date.isoformat() if dc.delivery_date else None,
                'created_at': dc.created_at.isoformat(),
            }
        
        return {
            'id': construction_order.id,
            'order_no': construction_order.order_no,
            'store_name': construction_order.store_name,
            'status': construction_order.status,
            'status_display': construction_order.get_status_display(),
            
            # 设计图纸
            'design_files': construction_order.design_files,
            
            # 施工时间线
            'construction_timeline': {
                'start_date': construction_order.construction_start_date.isoformat() if construction_order.construction_start_date else None,
                'end_date': construction_order.construction_end_date.isoformat() if construction_order.construction_end_date else None,
                'actual_end_date': construction_order.actual_end_date.isoformat() if construction_order.actual_end_date else None,
            },
            
            # 供应商
            'supplier': {
                'id': construction_order.supplier.id,
                'supplier_code': construction_order.supplier.supplier_code,
                'supplier_name': construction_order.supplier.supplier_name,
                'contact_person': construction_order.supplier.contact_person,
                'contact_phone': construction_order.supplier.contact_phone,
            } if construction_order.supplier else None,
            
            # 验收信息
            'acceptance': {
                'acceptance_date': construction_order.acceptance_date.isoformat() if construction_order.acceptance_date else None,
                'acceptance_result': construction_order.acceptance_result,
                'rectification_items': construction_order.rectification_items,
            },
            
            # 里程碑列表
            'milestones': milestones,
            
            # 交付清单
            'delivery_checklist': delivery_checklist,
            
            'created_at': construction_order.created_at.isoformat(),
        }
