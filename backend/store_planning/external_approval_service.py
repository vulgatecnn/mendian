"""
外部审批系统集成服务
"""

import requests
import json
import logging
from django.conf import settings
from django.core.exceptions import ValidationError
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ExternalApprovalService:
    """外部审批系统集成服务"""
    
    def __init__(self):
        # 从配置中获取外部审批系统的配置
        self.approval_system_config = getattr(settings, 'EXTERNAL_APPROVAL_SYSTEM', {})
        self.base_url = self.approval_system_config.get('base_url', '')
        self.api_key = self.approval_system_config.get('api_key', '')
        self.timeout = self.approval_system_config.get('timeout', 30)
        self.enabled = self.approval_system_config.get('enabled', False)
        
        # 请求头
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}' if self.api_key else '',
            'User-Agent': 'StorePlanning/1.0'
        }
    
    def is_enabled(self) -> bool:
        """检查外部审批系统是否启用"""
        return self.enabled and bool(self.base_url and self.api_key)
    
    def submit_approval_request(self, approval_data: Dict) -> Dict:
        """向外部审批系统提交审批申请"""
        
        if not self.is_enabled():
            logger.warning("外部审批系统未启用，跳过提交")
            return {
                'success': False,
                'message': '外部审批系统未启用',
                'external_approval_id': None
            }
        
        try:
            # 构建请求数据
            request_data = self._build_approval_request(approval_data)
            
            # 发送请求
            url = f"{self.base_url}/api/approvals"
            response = requests.post(
                url,
                json=request_data,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                external_approval_id = result.get('approval_id') or result.get('id')
                
                logger.info(f"成功提交审批申请到外部系统，ID: {external_approval_id}")
                
                return {
                    'success': True,
                    'message': '审批申请提交成功',
                    'external_approval_id': external_approval_id,
                    'external_data': result
                }
            else:
                error_msg = f"外部审批系统返回错误: {response.status_code} - {response.text}"
                logger.error(error_msg)
                
                return {
                    'success': False,
                    'message': error_msg,
                    'external_approval_id': None
                }
                
        except requests.exceptions.Timeout:
            error_msg = "外部审批系统请求超时"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'external_approval_id': None
            }
            
        except requests.exceptions.ConnectionError:
            error_msg = "无法连接到外部审批系统"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'external_approval_id': None
            }
            
        except Exception as e:
            error_msg = f"提交审批申请时发生未知错误: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'external_approval_id': None
            }
    
    def get_approval_status(self, external_approval_id: str) -> Dict:
        """获取外部审批系统中的审批状态"""
        
        if not self.is_enabled():
            return {
                'success': False,
                'message': '外部审批系统未启用',
                'status': 'unknown'
            }
        
        if not external_approval_id:
            return {
                'success': False,
                'message': '外部审批ID为空',
                'status': 'unknown'
            }
        
        try:
            url = f"{self.base_url}/api/approvals/{external_approval_id}"
            response = requests.get(
                url,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # 映射外部系统状态到内部状态
                external_status = result.get('status', '').lower()
                internal_status = self._map_external_status(external_status)
                
                return {
                    'success': True,
                    'message': '获取审批状态成功',
                    'status': internal_status,
                    'external_status': external_status,
                    'external_data': result,
                    'approved_by': result.get('approved_by'),
                    'approved_at': result.get('approved_at'),
                    'rejection_reason': result.get('rejection_reason'),
                    'approval_notes': result.get('approval_notes')
                }
            else:
                error_msg = f"获取审批状态失败: {response.status_code} - {response.text}"
                logger.error(error_msg)
                
                return {
                    'success': False,
                    'message': error_msg,
                    'status': 'unknown'
                }
                
        except Exception as e:
            error_msg = f"获取审批状态时发生错误: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'status': 'unknown'
            }
    
    def cancel_approval_request(self, external_approval_id: str, reason: str = '') -> Dict:
        """取消外部审批系统中的审批申请"""
        
        if not self.is_enabled():
            return {
                'success': False,
                'message': '外部审批系统未启用'
            }
        
        if not external_approval_id:
            return {
                'success': False,
                'message': '外部审批ID为空'
            }
        
        try:
            url = f"{self.base_url}/api/approvals/{external_approval_id}/cancel"
            request_data = {
                'reason': reason or '系统取消'
            }
            
            response = requests.post(
                url,
                json=request_data,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                logger.info(f"成功取消外部审批申请: {external_approval_id}")
                
                return {
                    'success': True,
                    'message': '审批申请取消成功'
                }
            else:
                error_msg = f"取消审批申请失败: {response.status_code} - {response.text}"
                logger.error(error_msg)
                
                return {
                    'success': False,
                    'message': error_msg
                }
                
        except Exception as e:
            error_msg = f"取消审批申请时发生错误: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
    
    def sync_approval_results(self, external_approval_ids: list) -> Dict:
        """批量同步外部审批结果"""
        
        if not self.is_enabled():
            return {
                'success': False,
                'message': '外部审批系统未启用',
                'results': []
            }
        
        if not external_approval_ids:
            return {
                'success': True,
                'message': '没有需要同步的审批',
                'results': []
            }
        
        results = []
        success_count = 0
        error_count = 0
        
        for external_id in external_approval_ids:
            try:
                status_result = self.get_approval_status(external_id)
                
                if status_result['success']:
                    results.append({
                        'external_approval_id': external_id,
                        'success': True,
                        'status': status_result['status'],
                        'external_data': status_result.get('external_data', {})
                    })
                    success_count += 1
                else:
                    results.append({
                        'external_approval_id': external_id,
                        'success': False,
                        'error': status_result['message']
                    })
                    error_count += 1
                    
            except Exception as e:
                results.append({
                    'external_approval_id': external_id,
                    'success': False,
                    'error': str(e)
                })
                error_count += 1
        
        return {
            'success': error_count == 0,
            'message': f'同步完成，成功{success_count}个，失败{error_count}个',
            'success_count': success_count,
            'error_count': error_count,
            'results': results
        }
    
    def _build_approval_request(self, approval_data: Dict) -> Dict:
        """构建外部审批系统的请求数据"""
        
        # 基础请求数据
        request_data = {
            'title': approval_data.get('title', '开店计划审批'),
            'description': approval_data.get('description', ''),
            'approval_type': approval_data.get('approval_type', ''),
            'priority': approval_data.get('priority', 'normal'),  # low, normal, high, urgent
            'requester': {
                'id': approval_data.get('requester_id', ''),
                'name': approval_data.get('requester_name', ''),
                'email': approval_data.get('requester_email', ''),
                'department': approval_data.get('requester_department', '')
            },
            'business_data': {
                'plan_id': approval_data.get('plan_id', ''),
                'plan_name': approval_data.get('plan_name', ''),
                'plan_type': approval_data.get('plan_type', ''),
                'plan_status': approval_data.get('plan_status', ''),
                'target_count': approval_data.get('target_count', 0),
                'budget_amount': approval_data.get('budget_amount', 0),
                'start_date': approval_data.get('start_date', ''),
                'end_date': approval_data.get('end_date', '')
            },
            'attachments': approval_data.get('attachments', []),
            'callback_url': approval_data.get('callback_url', ''),
            'created_at': datetime.now().isoformat()
        }
        
        # 根据审批类型添加特定数据
        approval_type = approval_data.get('approval_type', '')
        
        if approval_type == 'plan_publish':
            request_data['title'] = f"开店计划发布审批 - {approval_data.get('plan_name', '')}"
            request_data['description'] = f"申请发布开店计划：{approval_data.get('plan_name', '')}"
            
        elif approval_type == 'plan_cancel':
            request_data['title'] = f"开店计划取消审批 - {approval_data.get('plan_name', '')}"
            request_data['description'] = f"申请取消开店计划：{approval_data.get('plan_name', '')}"
            request_data['business_data']['cancel_reason'] = approval_data.get('cancel_reason', '')
            
        elif approval_type == 'plan_modify':
            request_data['title'] = f"开店计划修改审批 - {approval_data.get('plan_name', '')}"
            request_data['description'] = f"申请修改开店计划：{approval_data.get('plan_name', '')}"
            request_data['business_data']['modification_reason'] = approval_data.get('modification_reason', '')
        
        return request_data
    
    def _map_external_status(self, external_status: str) -> str:
        """映射外部系统状态到内部状态"""
        
        status_mapping = {
            'pending': 'pending',
            'in_progress': 'pending',
            'approved': 'approved',
            'rejected': 'rejected',
            'cancelled': 'cancelled',
            'timeout': 'rejected',
            'expired': 'rejected'
        }
        
        return status_mapping.get(external_status.lower(), 'pending')
    
    def get_system_info(self) -> Dict:
        """获取外部审批系统信息"""
        
        if not self.is_enabled():
            return {
                'enabled': False,
                'message': '外部审批系统未启用'
            }
        
        try:
            url = f"{self.base_url}/api/system/info"
            response = requests.get(
                url,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                
                return {
                    'enabled': True,
                    'connected': True,
                    'system_name': result.get('name', '外部审批系统'),
                    'version': result.get('version', '未知'),
                    'api_version': result.get('api_version', '未知'),
                    'features': result.get('features', []),
                    'last_check': datetime.now().isoformat()
                }
            else:
                return {
                    'enabled': True,
                    'connected': False,
                    'error': f"连接失败: {response.status_code}",
                    'last_check': datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                'enabled': True,
                'connected': False,
                'error': str(e),
                'last_check': datetime.now().isoformat()
            }
    
    def test_connection(self) -> Dict:
        """测试与外部审批系统的连接"""
        
        if not self.is_enabled():
            return {
                'success': False,
                'message': '外部审批系统未启用'
            }
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(
                url,
                headers=self.headers,
                timeout=10  # 测试连接使用较短的超时时间
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'message': '连接测试成功',
                    'response_time': response.elapsed.total_seconds(),
                    'status_code': response.status_code
                }
            else:
                return {
                    'success': False,
                    'message': f'连接测试失败: HTTP {response.status_code}',
                    'status_code': response.status_code
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'message': '连接超时'
            }
            
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'message': '无法连接到外部审批系统'
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'连接测试失败: {str(e)}'
            }


class ApprovalResultProcessor:
    """审批结果处理器"""
    
    def __init__(self):
        self.external_service = ExternalApprovalService()
    
    def process_approval_result(self, approval, result_data: Dict) -> Dict:
        """处理审批结果"""
        
        try:
            from .models import PlanApproval
            from .services import PlanBusinessService
            
            business_service = PlanBusinessService()
            
            # 根据审批结果执行相应的业务逻辑
            if result_data.get('status') == 'approved':
                return self._process_approval_success(approval, result_data, business_service)
            elif result_data.get('status') == 'rejected':
                return self._process_approval_rejection(approval, result_data)
            else:
                return {
                    'success': False,
                    'message': f"未知的审批状态: {result_data.get('status')}"
                }
                
        except Exception as e:
            logger.error(f"处理审批结果时发生错误: {str(e)}")
            return {
                'success': False,
                'message': f"处理审批结果失败: {str(e)}"
            }
    
    def _process_approval_success(self, approval, result_data: Dict, business_service) -> Dict:
        """处理审批通过"""
        
        try:
            plan = approval.plan
            
            # 根据审批类型执行相应的业务逻辑
            if approval.approval_type == 'plan_publish':
                # 发布计划
                business_service.publish_plan(plan, None)  # 外部审批通过，审批人为None
                
            elif approval.approval_type == 'plan_cancel':
                # 取消计划
                cancel_reason = result_data.get('approval_notes') or approval.approval_notes or '外部审批通过取消'
                business_service.cancel_plan(plan, cancel_reason, None)
                
            elif approval.approval_type == 'plan_modify':
                # 计划修改审批通过
                # 这里可以根据实际需求添加相应的业务逻辑
                pass
            
            # 更新审批记录状态
            approval.status = 'approved'
            approval.approved_at = datetime.now()
            approval.approval_notes = result_data.get('approval_notes', '')
            approval.save()
            
            # 记录日志
            business_service._log_plan_action(
                plan=plan,
                action_type='external_approval_approved',
                description=f'外部审批系统通过{approval.get_approval_type_display()}',
                user=None
            )
            
            return {
                'success': True,
                'message': '审批通过处理成功',
                'plan_status': plan.status
            }
            
        except Exception as e:
            logger.error(f"处理审批通过时发生错误: {str(e)}")
            return {
                'success': False,
                'message': f"处理审批通过失败: {str(e)}"
            }
    
    def _process_approval_rejection(self, approval, result_data: Dict) -> Dict:
        """处理审批拒绝"""
        
        try:
            from .services import PlanBusinessService
            
            business_service = PlanBusinessService()
            plan = approval.plan
            
            # 更新审批记录状态
            approval.status = 'rejected'
            approval.approved_at = datetime.now()
            approval.rejection_reason = result_data.get('rejection_reason', '外部审批系统拒绝')
            approval.save()
            
            # 执行审批拒绝后的业务逻辑
            if approval.approval_type == 'plan_publish':
                # 发布审批被拒绝，计划保持草稿状态
                pass
                
            elif approval.approval_type == 'plan_cancel':
                # 取消审批被拒绝，计划保持原状态
                pass
                
            elif approval.approval_type == 'plan_modify':
                # 修改审批被拒绝
                pass
            
            # 记录日志
            business_service._log_plan_action(
                plan=plan,
                action_type='external_approval_rejected',
                description=f'外部审批系统拒绝{approval.get_approval_type_display()}: {approval.rejection_reason}',
                user=None
            )
            
            return {
                'success': True,
                'message': '审批拒绝处理成功',
                'plan_status': plan.status
            }
            
        except Exception as e:
            logger.error(f"处理审批拒绝时发生错误: {str(e)}")
            return {
                'success': False,
                'message': f"处理审批拒绝失败: {str(e)}"
            }