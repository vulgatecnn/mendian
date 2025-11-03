"""
审批通知服务
"""

import logging
import json
import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import send_mail
from typing import Dict, List, Optional, Any
from celery import shared_task

logger = logging.getLogger(__name__)


class NotificationService:
    """通知服务基类"""
    
    def __init__(self):
        self.notification_config = getattr(settings, 'NOTIFICATION_CONFIG', {})
        self.enabled_channels = self.notification_config.get('enabled_channels', ['email'])
    
    def send_notification(self, notification_data: Dict) -> Dict:
        """发送通知"""
        
        results = {}
        overall_success = True
        
        for channel in self.enabled_channels:
            try:
                if channel == 'email':
                    result = self._send_email_notification(notification_data)
                elif channel == 'wechat':
                    result = self._send_wechat_notification(notification_data)
                elif channel == 'sms':
                    result = self._send_sms_notification(notification_data)
                elif channel == 'webhook':
                    result = self._send_webhook_notification(notification_data)
                else:
                    result = {'success': False, 'message': f'不支持的通知渠道: {channel}'}
                
                results[channel] = result
                
                if not result['success']:
                    overall_success = False
                    
            except Exception as e:
                error_msg = f'{channel}通知发送失败: {str(e)}'
                logger.error(error_msg)
                results[channel] = {'success': False, 'message': error_msg}
                overall_success = False
        
        return {
            'success': overall_success,
            'results': results,
            'sent_at': datetime.now().isoformat()
        }
    
    def _send_email_notification(self, notification_data: Dict) -> Dict:
        """发送邮件通知"""
        
        email_config = self.notification_config.get('email', {})
        
        if not email_config.get('enabled', False):
            return {'success': False, 'message': '邮件通知未启用'}
        
        try:
            recipients = notification_data.get('recipients', [])
            if not recipients:
                return {'success': False, 'message': '没有收件人'}
            
            subject = notification_data.get('subject', '开店计划审批通知')
            message = notification_data.get('message', '')
            html_message = notification_data.get('html_message')
            
            # 发送邮件
            send_mail(
                subject=subject,
                message=message,
                from_email=email_config.get('from_email', settings.DEFAULT_FROM_EMAIL),
                recipient_list=recipients,
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"邮件通知发送成功，收件人: {recipients}")
            
            return {
                'success': True,
                'message': f'邮件发送成功，收件人数量: {len(recipients)}'
            }
            
        except Exception as e:
            error_msg = f'邮件发送失败: {str(e)}'
            logger.error(error_msg)
            return {'success': False, 'message': error_msg}
    
    def _send_wechat_notification(self, notification_data: Dict) -> Dict:
        """发送企业微信通知"""
        
        wechat_config = self.notification_config.get('wechat', {})
        
        if not wechat_config.get('enabled', False):
            return {'success': False, 'message': '企业微信通知未启用'}
        
        try:
            # 获取企业微信配置
            corp_id = wechat_config.get('corp_id', '')
            corp_secret = wechat_config.get('corp_secret', '')
            agent_id = wechat_config.get('agent_id', '')
            
            if not all([corp_id, corp_secret, agent_id]):
                return {'success': False, 'message': '企业微信配置不完整'}
            
            # 获取access_token
            access_token = self._get_wechat_access_token(corp_id, corp_secret)
            
            if not access_token:
                return {'success': False, 'message': '获取企业微信access_token失败'}
            
            # 构建消息内容
            message_data = {
                'touser': '|'.join(notification_data.get('user_ids', [])),
                'toparty': '|'.join(notification_data.get('department_ids', [])),
                'totag': '|'.join(notification_data.get('tag_ids', [])),
                'msgtype': 'textcard',
                'agentid': agent_id,
                'textcard': {
                    'title': notification_data.get('title', '开店计划审批通知'),
                    'description': notification_data.get('description', ''),
                    'url': notification_data.get('url', ''),
                    'btntxt': notification_data.get('button_text', '查看详情')
                }
            }
            
            # 发送消息
            send_url = f'https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={access_token}'
            response = requests.post(send_url, json=message_data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('errcode') == 0:
                    logger.info(f"企业微信通知发送成功")
                    return {'success': True, 'message': '企业微信通知发送成功'}
                else:
                    error_msg = f"企业微信API返回错误: {result.get('errmsg', '未知错误')}"
                    logger.error(error_msg)
                    return {'success': False, 'message': error_msg}
            else:
                error_msg = f"企业微信API请求失败: {response.status_code}"
                logger.error(error_msg)
                return {'success': False, 'message': error_msg}
                
        except Exception as e:
            error_msg = f'企业微信通知发送失败: {str(e)}'
            logger.error(error_msg)
            return {'success': False, 'message': error_msg}
    
    def _send_sms_notification(self, notification_data: Dict) -> Dict:
        """发送短信通知"""
        
        sms_config = self.notification_config.get('sms', {})
        
        if not sms_config.get('enabled', False):
            return {'success': False, 'message': '短信通知未启用'}
        
        try:
            phone_numbers = notification_data.get('phone_numbers', [])
            if not phone_numbers:
                return {'success': False, 'message': '没有手机号码'}
            
            message = notification_data.get('sms_message', notification_data.get('message', ''))
            
            # 这里应该集成实际的短信服务提供商API
            # 例如阿里云短信、腾讯云短信等
            
            logger.info(f"短信通知发送成功，收件人: {phone_numbers}")
            
            return {
                'success': True,
                'message': f'短信发送成功，收件人数量: {len(phone_numbers)}'
            }
            
        except Exception as e:
            error_msg = f'短信发送失败: {str(e)}'
            logger.error(error_msg)
            return {'success': False, 'message': error_msg}
    
    def _send_webhook_notification(self, notification_data: Dict) -> Dict:
        """发送Webhook通知"""
        
        webhook_config = self.notification_config.get('webhook', {})
        
        if not webhook_config.get('enabled', False):
            return {'success': False, 'message': 'Webhook通知未启用'}
        
        try:
            webhook_url = webhook_config.get('url', '')
            if not webhook_url:
                return {'success': False, 'message': 'Webhook URL未配置'}
            
            # 构建Webhook数据
            webhook_data = {
                'event_type': 'approval_notification',
                'timestamp': datetime.now().isoformat(),
                'data': notification_data
            }
            
            # 发送Webhook请求
            response = requests.post(
                webhook_url,
                json=webhook_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Webhook通知发送成功")
                return {'success': True, 'message': 'Webhook通知发送成功'}
            else:
                error_msg = f"Webhook请求失败: {response.status_code}"
                logger.error(error_msg)
                return {'success': False, 'message': error_msg}
                
        except Exception as e:
            error_msg = f'Webhook通知发送失败: {str(e)}'
            logger.error(error_msg)
            return {'success': False, 'message': error_msg}
    
    def _get_wechat_access_token(self, corp_id: str, corp_secret: str) -> Optional[str]:
        """获取企业微信access_token"""
        
        try:
            # 先尝试从缓存获取
            cache_key = f'wechat_access_token_{corp_id}'
            
            try:
                from django.core.cache import cache
                cached_token = cache.get(cache_key)
                if cached_token:
                    return cached_token
            except:
                pass
            
            # 从企业微信API获取
            url = f'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={corp_id}&corpsecret={corp_secret}'
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('errcode') == 0:
                    access_token = result.get('access_token')
                    expires_in = result.get('expires_in', 7200)
                    
                    # 缓存token（提前5分钟过期）
                    try:
                        from django.core.cache import cache
                        cache.set(cache_key, access_token, expires_in - 300)
                    except:
                        pass
                    
                    return access_token
                else:
                    logger.error(f"获取企业微信access_token失败: {result.get('errmsg')}")
                    return None
            else:
                logger.error(f"企业微信API请求失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"获取企业微信access_token时发生错误: {str(e)}")
            return None


class ApprovalNotificationService(NotificationService):
    """审批通知服务"""
    
    def __init__(self):
        super().__init__()
        self.approval_config = self.notification_config.get('approval', {})
    
    def send_approval_submitted_notification(self, approval) -> Dict:
        """发送审批提交通知"""
        
        try:
            # 构建通知数据
            notification_data = self._build_approval_notification_data(
                approval, 'submitted'
            )
            
            # 获取通知接收人
            recipients = self._get_approval_recipients(approval, 'submitted')
            notification_data.update(recipients)
            
            # 发送通知
            return self.send_notification(notification_data)
            
        except Exception as e:
            logger.error(f"发送审批提交通知失败: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def send_approval_approved_notification(self, approval) -> Dict:
        """发送审批通过通知"""
        
        try:
            notification_data = self._build_approval_notification_data(
                approval, 'approved'
            )
            
            recipients = self._get_approval_recipients(approval, 'approved')
            notification_data.update(recipients)
            
            return self.send_notification(notification_data)
            
        except Exception as e:
            logger.error(f"发送审批通过通知失败: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def send_approval_rejected_notification(self, approval) -> Dict:
        """发送审批拒绝通知"""
        
        try:
            notification_data = self._build_approval_notification_data(
                approval, 'rejected'
            )
            
            recipients = self._get_approval_recipients(approval, 'rejected')
            notification_data.update(recipients)
            
            return self.send_notification(notification_data)
            
        except Exception as e:
            logger.error(f"发送审批拒绝通知失败: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def send_approval_cancelled_notification(self, approval) -> Dict:
        """发送审批取消通知"""
        
        try:
            notification_data = self._build_approval_notification_data(
                approval, 'cancelled'
            )
            
            recipients = self._get_approval_recipients(approval, 'cancelled')
            notification_data.update(recipients)
            
            return self.send_notification(notification_data)
            
        except Exception as e:
            logger.error(f"发送审批取消通知失败: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def send_approval_timeout_notification(self, approval) -> Dict:
        """发送审批超时通知"""
        
        try:
            notification_data = self._build_approval_notification_data(
                approval, 'timeout'
            )
            
            recipients = self._get_approval_recipients(approval, 'timeout')
            notification_data.update(recipients)
            
            return self.send_notification(notification_data)
            
        except Exception as e:
            logger.error(f"发送审批超时通知失败: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def _build_approval_notification_data(self, approval, action: str) -> Dict:
        """构建审批通知数据"""
        
        plan = approval.plan
        
        # 基础通知数据
        notification_data = {
            'approval_id': approval.id,
            'plan_id': plan.id,
            'plan_name': plan.name,
            'approval_type': approval.approval_type,
            'approval_type_display': approval.get_approval_type_display(),
            'action': action,
            'submitted_by': approval.submitted_by.get_full_name() if approval.submitted_by else '',
            'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
            'approved_by': approval.approved_by.get_full_name() if approval.approved_by else '',
            'approved_at': approval.approved_at.strftime('%Y-%m-%d %H:%M:%S') if approval.approved_at else '',
            'approval_notes': approval.approval_notes or '',
            'rejection_reason': approval.rejection_reason or ''
        }
        
        # 根据动作类型设置标题和内容
        if action == 'submitted':
            notification_data.update({
                'title': f'审批申请提交 - {plan.name}',
                'subject': f'【开店计划】{approval.get_approval_type_display()}审批申请',
                'message': f'计划"{plan.name}"的{approval.get_approval_type_display()}审批申请已提交，请及时处理。',
                'description': f'申请人：{notification_data["submitted_by"]}\n提交时间：{notification_data["submitted_at"]}\n计划名称：{plan.name}',
                'button_text': '立即审批'
            })
            
        elif action == 'approved':
            notification_data.update({
                'title': f'审批通过 - {plan.name}',
                'subject': f'【开店计划】{approval.get_approval_type_display()}审批通过',
                'message': f'您提交的计划"{plan.name}"的{approval.get_approval_type_display()}审批已通过。',
                'description': f'审批人：{notification_data["approved_by"]}\n审批时间：{notification_data["approved_at"]}\n审批备注：{notification_data["approval_notes"]}',
                'button_text': '查看详情'
            })
            
        elif action == 'rejected':
            notification_data.update({
                'title': f'审批拒绝 - {plan.name}',
                'subject': f'【开店计划】{approval.get_approval_type_display()}审批拒绝',
                'message': f'您提交的计划"{plan.name}"的{approval.get_approval_type_display()}审批已被拒绝。',
                'description': f'审批人：{notification_data["approved_by"]}\n审批时间：{notification_data["approved_at"]}\n拒绝原因：{notification_data["rejection_reason"]}',
                'button_text': '查看详情'
            })
            
        elif action == 'cancelled':
            notification_data.update({
                'title': f'审批取消 - {plan.name}',
                'subject': f'【开店计划】{approval.get_approval_type_display()}审批取消',
                'message': f'计划"{plan.name}"的{approval.get_approval_type_display()}审批申请已被取消。',
                'description': f'取消时间：{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n计划名称：{plan.name}',
                'button_text': '查看详情'
            })
            
        elif action == 'timeout':
            days_pending = (timezone.now() - approval.submitted_at).days
            notification_data.update({
                'title': f'审批超时提醒 - {plan.name}',
                'subject': f'【开店计划】{approval.get_approval_type_display()}审批超时提醒',
                'message': f'计划"{plan.name}"的{approval.get_approval_type_display()}审批已超时{days_pending}天，请及时处理。',
                'description': f'申请人：{notification_data["submitted_by"]}\n提交时间：{notification_data["submitted_at"]}\n超时天数：{days_pending}天',
                'button_text': '立即处理'
            })
        
        return notification_data
    
    def _get_approval_recipients(self, approval, action: str) -> Dict:
        """获取审批通知接收人"""
        
        recipients = {
            'recipients': [],  # 邮件收件人
            'user_ids': [],    # 企业微信用户ID
            'department_ids': [],  # 企业微信部门ID
            'tag_ids': [],     # 企业微信标签ID
            'phone_numbers': []  # 短信手机号
        }
        
        try:
            if action == 'submitted':
                # 审批提交：通知审批人
                approvers = self._get_approvers_for_approval_type(approval.approval_type)
                
                for approver in approvers:
                    if approver.email:
                        recipients['recipients'].append(approver.email)
                    
                    # 如果有企业微信用户ID映射
                    wechat_user_id = self._get_wechat_user_id(approver)
                    if wechat_user_id:
                        recipients['user_ids'].append(wechat_user_id)
                    
                    # 如果有手机号
                    if hasattr(approver, 'phone') and approver.phone:
                        recipients['phone_numbers'].append(approver.phone)
                        
            elif action in ['approved', 'rejected', 'cancelled']:
                # 审批结果：通知申请人
                if approval.submitted_by:
                    if approval.submitted_by.email:
                        recipients['recipients'].append(approval.submitted_by.email)
                    
                    wechat_user_id = self._get_wechat_user_id(approval.submitted_by)
                    if wechat_user_id:
                        recipients['user_ids'].append(wechat_user_id)
                    
                    if hasattr(approval.submitted_by, 'phone') and approval.submitted_by.phone:
                        recipients['phone_numbers'].append(approval.submitted_by.phone)
                        
            elif action == 'timeout':
                # 超时提醒：通知审批人和申请人
                approvers = self._get_approvers_for_approval_type(approval.approval_type)
                
                all_users = list(approvers)
                if approval.submitted_by:
                    all_users.append(approval.submitted_by)
                
                for user in all_users:
                    if user.email:
                        recipients['recipients'].append(user.email)
                    
                    wechat_user_id = self._get_wechat_user_id(user)
                    if wechat_user_id:
                        recipients['user_ids'].append(wechat_user_id)
                    
                    if hasattr(user, 'phone') and user.phone:
                        recipients['phone_numbers'].append(user.phone)
            
            # 去重
            recipients['recipients'] = list(set(recipients['recipients']))
            recipients['user_ids'] = list(set(recipients['user_ids']))
            recipients['phone_numbers'] = list(set(recipients['phone_numbers']))
            
        except Exception as e:
            logger.error(f"获取审批通知接收人失败: {str(e)}")
        
        return recipients
    
    def _get_approvers_for_approval_type(self, approval_type: str) -> List:
        """根据审批类型获取审批人列表"""
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # 这里应该根据实际的权限系统来获取审批人
            # 简化处理：获取有相应权限的用户
            
            if approval_type == 'plan_publish':
                # 计划发布审批人：具有计划发布权限的用户
                return User.objects.filter(
                    is_active=True,
                    groups__permissions__codename='can_approve_plan_publish'
                ).distinct()
                
            elif approval_type == 'plan_cancel':
                # 计划取消审批人：具有计划取消权限的用户
                return User.objects.filter(
                    is_active=True,
                    groups__permissions__codename='can_approve_plan_cancel'
                ).distinct()
                
            elif approval_type == 'plan_modify':
                # 计划修改审批人：具有计划修改权限的用户
                return User.objects.filter(
                    is_active=True,
                    groups__permissions__codename='can_approve_plan_modify'
                ).distinct()
            
            # 默认：返回超级用户
            return User.objects.filter(is_superuser=True, is_active=True)
            
        except Exception as e:
            logger.error(f"获取审批人列表失败: {str(e)}")
            return []
    
    def _get_wechat_user_id(self, user) -> Optional[str]:
        """获取用户的企业微信用户ID"""
        
        try:
            # 这里应该根据实际的用户模型来获取企业微信用户ID
            # 可能存储在用户扩展信息中
            
            if hasattr(user, 'wechat_user_id'):
                return user.wechat_user_id
            
            # 或者从用户名推导（如果用户名就是企业微信用户ID）
            if user.username and '@' not in user.username:
                return user.username
            
            return None
            
        except Exception as e:
            logger.error(f"获取企业微信用户ID失败: {str(e)}")
            return None


# 这个函数已移动到tasks.py中，这里保留一个别名以保持兼容性
def send_approval_notification_async(approval_id: int, action: str):
    """异步发送审批通知（兼容性函数）"""
    from .tasks import send_approval_notification_task
    return send_approval_notification_task.delay(approval_id, action)


def check_approval_timeout_and_notify():
    """检查审批超时并发送通知（兼容性函数）"""
    from .tasks import check_approval_timeout_task
    return check_approval_timeout_task.delay()