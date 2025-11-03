"""
初始化预置审批模板的管理命令
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from approval.models import ApprovalTemplate
from system_management.models import User


class Command(BaseCommand):
    help = '初始化预置审批模板'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新创建模板（会删除已存在的模板）',
        )
    
    def handle(self, *args, **options):
        force = options['force']
        
        # 获取系统管理员用户（假设ID为1的用户是管理员）
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(
                    self.style.ERROR('未找到超级管理员用户，请先创建管理员用户')
                )
                return
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('未找到用户，请先运行数据库迁移')
            )
            return
        
        templates_data = self._get_templates_data()
        
        with transaction.atomic():
            for template_data in templates_data:
                template_code = template_data['template_code']
                
                # 检查模板是否已存在
                if ApprovalTemplate.objects.filter(template_code=template_code).exists():
                    if force:
                        ApprovalTemplate.objects.filter(template_code=template_code).delete()
                        self.stdout.write(f'删除已存在的模板: {template_code}')
                    else:
                        self.stdout.write(f'模板已存在，跳过: {template_code}')
                        continue
                
                # 创建模板
                template = ApprovalTemplate.objects.create(
                    template_code=template_data['template_code'],
                    template_name=template_data['template_name'],
                    description=template_data['description'],
                    form_schema=template_data['form_schema'],
                    flow_config=template_data['flow_config'],
                    status='active',
                    created_by=admin_user
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'创建模板成功: {template.template_name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('预置审批模板初始化完成')
        )
    
    def _get_templates_data(self):
        """获取预置模板数据"""
        return [
            self._get_store_approval_template(),
            self._get_license_approval_template(),
            self._get_construction_supplier_template(),
            self._get_delivery_confirmation_template(),
            self._get_opening_approval_template(),
            self._get_store_repair_template(),
            self._get_store_closure_template(),
        ]
    
    def _get_store_approval_template(self):
        """报店审批模板"""
        return {
            'template_code': 'STORE_APPROVAL',
            'template_name': '报店审批',
            'description': '新门店选址报批审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称',
                        'description': '拟开设门店的名称'
                    },
                    'location_address': {
                        'type': 'string',
                        'title': '门店地址',
                        'description': '门店详细地址'
                    },
                    'business_region': {
                        'type': 'string',
                        'title': '业务大区',
                        'description': '所属业务大区'
                    },
                    'store_area': {
                        'type': 'number',
                        'title': '门店面积',
                        'description': '门店营业面积（平方米）'
                    },
                    'monthly_rent': {
                        'type': 'number',
                        'title': '月租金',
                        'description': '月租金金额（元）'
                    },
                    'decoration_cost': {
                        'type': 'number',
                        'title': '装修费用',
                        'description': '预计装修费用（元）'
                    },
                    'equipment_cost': {
                        'type': 'number',
                        'title': '设备费用',
                        'description': '预计设备费用（元）'
                    },
                    'expected_monthly_sales': {
                        'type': 'number',
                        'title': '预期月销售额',
                        'description': '预期月销售额（元）'
                    },
                    'roi': {
                        'type': 'number',
                        'title': '投资回报率',
                        'description': '投资回报率（%）'
                    },
                    'payback_period': {
                        'type': 'integer',
                        'title': '回本周期',
                        'description': '回本周期（月）'
                    },
                    'legal_entity': {
                        'type': 'string',
                        'title': '法人主体',
                        'description': '签约法人主体'
                    },
                    'approval_reason': {
                        'type': 'string',
                        'title': '申请理由',
                        'description': '报店申请理由'
                    }
                },
                'required': [
                    'store_name', 'location_address', 'business_region',
                    'store_area', 'monthly_rent', 'expected_monthly_sales',
                    'legal_entity', 'approval_reason'
                ]
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '商务经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['business_manager']
                        }
                    },
                    {
                        'name': '区域总监审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['regional_director']
                        }
                    },
                    {
                        'name': '总经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['general_manager']
                        }
                    }
                ]
            }
        }
    
    def _get_license_approval_template(self):
        """执照申请审批模板"""
        return {
            'template_code': 'LICENSE_APPROVAL',
            'template_name': '执照申请审批',
            'description': '门店营业执照申请审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称'
                    },
                    'license_type': {
                        'type': 'string',
                        'title': '执照类型',
                        'enum': ['营业执照', '食品经营许可证', '消防许可证', '其他']
                    },
                    'application_reason': {
                        'type': 'string',
                        'title': '申请原因'
                    },
                    'expected_completion_date': {
                        'type': 'string',
                        'format': 'date',
                        'title': '预期完成日期'
                    },
                    'documents': {
                        'type': 'array',
                        'title': '相关文档',
                        'items': {
                            'type': 'string'
                        }
                    }
                },
                'required': ['store_name', 'license_type', 'application_reason']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '商务经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['business_manager']
                        }
                    },
                    {
                        'name': '法务审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['legal_affairs']
                        }
                    }
                ]
            }
        }
    
    def _get_construction_supplier_template(self):
        """施工供应商比价审批模板"""
        return {
            'template_code': 'CONSTRUCTION_SUPPLIER',
            'template_name': '施工供应商比价审批',
            'description': '门店施工供应商选择比价审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称'
                    },
                    'project_description': {
                        'type': 'string',
                        'title': '项目描述'
                    },
                    'suppliers': {
                        'type': 'array',
                        'title': '供应商报价',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'supplier_name': {'type': 'string', 'title': '供应商名称'},
                                'quoted_price': {'type': 'number', 'title': '报价金额'},
                                'construction_period': {'type': 'integer', 'title': '施工周期（天）'},
                                'quality_score': {'type': 'number', 'title': '质量评分'}
                            }
                        }
                    },
                    'recommended_supplier': {
                        'type': 'string',
                        'title': '推荐供应商'
                    },
                    'recommendation_reason': {
                        'type': 'string',
                        'title': '推荐理由'
                    }
                },
                'required': ['store_name', 'project_description', 'recommended_supplier']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '工程经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['engineering_manager']
                        }
                    },
                    {
                        'name': '采购经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['procurement_manager']
                        }
                    }
                ]
            }
        }
    
    def _get_delivery_confirmation_template(self):
        """交付确认审批模板"""
        return {
            'template_code': 'DELIVERY_CONFIRMATION',
            'template_name': '交付确认审批',
            'description': '门店施工完成交付确认审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称'
                    },
                    'construction_completion_date': {
                        'type': 'string',
                        'format': 'date',
                        'title': '施工完成日期'
                    },
                    'quality_inspection_result': {
                        'type': 'string',
                        'title': '质量检查结果',
                        'enum': ['合格', '不合格', '需整改']
                    },
                    'delivery_items': {
                        'type': 'array',
                        'title': '交付清单',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'item_name': {'type': 'string', 'title': '项目名称'},
                                'status': {'type': 'string', 'title': '状态', 'enum': ['已完成', '未完成', '需整改']}
                            }
                        }
                    },
                    'issues': {
                        'type': 'string',
                        'title': '存在问题'
                    },
                    'confirmation_opinion': {
                        'type': 'string',
                        'title': '确认意见'
                    }
                },
                'required': ['store_name', 'construction_completion_date', 'quality_inspection_result']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '工程经理确认',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['engineering_manager']
                        }
                    },
                    {
                        'name': '商务经理确认',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['business_manager']
                        }
                    }
                ]
            }
        }
    
    def _get_opening_approval_template(self):
        """开业申请审批模板"""
        return {
            'template_code': 'OPENING_APPROVAL',
            'template_name': '开业申请审批',
            'description': '门店开业申请审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称'
                    },
                    'planned_opening_date': {
                        'type': 'string',
                        'format': 'date',
                        'title': '计划开业日期'
                    },
                    'store_manager': {
                        'type': 'string',
                        'title': '店长'
                    },
                    'staff_count': {
                        'type': 'integer',
                        'title': '员工人数'
                    },
                    'preparation_status': {
                        'type': 'object',
                        'title': '筹备状态',
                        'properties': {
                            'license_ready': {'type': 'boolean', 'title': '证照齐全'},
                            'equipment_ready': {'type': 'boolean', 'title': '设备到位'},
                            'staff_trained': {'type': 'boolean', 'title': '员工培训完成'},
                            'inventory_ready': {'type': 'boolean', 'title': '库存准备完成'}
                        }
                    },
                    'opening_activities': {
                        'type': 'string',
                        'title': '开业活动方案'
                    }
                },
                'required': ['store_name', 'planned_opening_date', 'store_manager']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '区域经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['regional_manager']
                        }
                    },
                    {
                        'name': '运营总监审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['operations_director']
                        }
                    }
                ]
            }
        }
    
    def _get_store_repair_template(self):
        """门店报修审批模板"""
        return {
            'template_code': 'STORE_REPAIR',
            'template_name': '门店报修审批',
            'description': '门店设备设施报修审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称'
                    },
                    'repair_category': {
                        'type': 'string',
                        'title': '报修类别',
                        'enum': ['设备维修', '装修维护', '水电维修', '其他']
                    },
                    'problem_description': {
                        'type': 'string',
                        'title': '问题描述'
                    },
                    'urgency_level': {
                        'type': 'string',
                        'title': '紧急程度',
                        'enum': ['紧急', '一般', '不紧急']
                    },
                    'estimated_cost': {
                        'type': 'number',
                        'title': '预估费用'
                    },
                    'expected_completion_date': {
                        'type': 'string',
                        'format': 'date',
                        'title': '期望完成日期'
                    },
                    'photos': {
                        'type': 'array',
                        'title': '现场照片',
                        'items': {
                            'type': 'string'
                        }
                    }
                },
                'required': ['store_name', 'repair_category', 'problem_description', 'urgency_level']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '区域经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['regional_manager']
                        }
                    },
                    {
                        'name': '工程经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['engineering_manager']
                        },
                        'condition': {
                            'field': 'estimated_cost',
                            'operator': 'gt',
                            'value': 5000
                        }
                    }
                ]
            }
        }
    
    def _get_store_closure_template(self):
        """闭店审批模板"""
        return {
            'template_code': 'STORE_CLOSURE',
            'template_name': '闭店审批',
            'description': '门店关闭审批流程',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'store_name': {
                        'type': 'string',
                        'title': '门店名称'
                    },
                    'closure_reason': {
                        'type': 'string',
                        'title': '闭店原因',
                        'enum': ['经营不善', '租约到期', '政策原因', '其他']
                    },
                    'detailed_reason': {
                        'type': 'string',
                        'title': '详细原因'
                    },
                    'planned_closure_date': {
                        'type': 'string',
                        'format': 'date',
                        'title': '计划闭店日期'
                    },
                    'staff_arrangement': {
                        'type': 'string',
                        'title': '员工安排'
                    },
                    'asset_disposal': {
                        'type': 'string',
                        'title': '资产处置方案'
                    },
                    'customer_notification': {
                        'type': 'string',
                        'title': '客户通知方案'
                    },
                    'financial_settlement': {
                        'type': 'string',
                        'title': '财务结算情况'
                    }
                },
                'required': ['store_name', 'closure_reason', 'planned_closure_date']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '区域经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['regional_manager']
                        }
                    },
                    {
                        'name': '运营总监审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['operations_director']
                        }
                    },
                    {
                        'name': '总经理审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'role',
                            'role_codes': ['general_manager']
                        }
                    }
                ]
            }
        }