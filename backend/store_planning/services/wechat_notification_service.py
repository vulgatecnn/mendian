"""
企业微信消息通知服务
用于开店计划状态变更和预警消息推送
"""
import logging
import requests
from typing import List, Optional, Dict
from django.conf import settings
from system_management.services.wechat_token import token_manager

logger = logging.getLogger(__name__)


class WeChatNotificationService:
    """企业微信消息通知服务"""
    
    # 企业微信API基础URL
    API_BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin'
    
    # 消息类型
    MSG_TYPE_TEXT = 'text'
    MSG_TYPE_TEXTCARD = 'textcard'
    
    def __init__(self):
        """初始化通知服务"""
        self.corp_id = getattr(settings, 'WECHAT_CORP_ID', '')
        self.agent_id = getattr(settings, 'WECHAT_AGENT_ID', '')
        self.token_manager = token_manager
    
    def send_text_message(
        self,
        content: str,
        user_ids: Optional[List[str]] = None,
        department_ids: Optional[List[int]] = None,
        tag_ids: Optional[List[int]] = None,
        to_all: bool = False
    ) -> Dict:
        """
        发送文本消息
        
        Args:
            content: 消息内容
            user_ids: 用户ID列表（企业微信用户ID）
            department_ids: 部门ID列表
            tag_ids: 标签ID列表
            to_all: 是否发送给所有人
            
        Returns:
            发送结果
        """
        try:
            # 获取访问令牌
            access_token = self.token_manager.get_access_token()
            
            # 构建接收者
            touser = '@all' if to_all else '|'.join(user_ids or [])
            toparty = '|'.join(str(d) for d in (department_ids or []))
            totag = '|'.join(str(t) for t in (tag_ids or []))
            
            # 构建消息体
            message = {
                'touser': touser,
                'toparty': toparty,
                'totag': totag,
                'msgtype': self.MSG_TYPE_TEXT,
                'agentid': self.agent_id,
                'text': {
                    'content': content
                },
                'safe': 0
            }
            
            # 发送消息
            url = f'{self.API_BASE_URL}/message/send?access_token={access_token}'
            response = requests.post(url, json=message, timeout=10)
            result = response.json()
            
            if result.get('errcode') == 0:
                logger.info(f"企业微信消息发送成功: {content[:50]}...")
                return {
                    'success': True,
                    'invaliduser': result.get('invaliduser', ''),
                    'invalidparty': result.get('invalidparty', ''),
                    'invalidtag': result.get('invalidtag', '')
                }
            else:
                logger.error(f"企业微信消息发送失败: {result}")
                return {
                    'success': False,
                    'error': result.get('errmsg', '未知错误')
                }
                
        except Exception as e:
            logger.error(f"发送企业微信消息异常: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_textcard_message(
        self,
        title: str,
        description: str,
        url: str,
        btntxt: str = '详情',
        user_ids: Optional[List[str]] = None,
        department_ids: Optional[List[int]] = None,
        to_all: bool = False
    ) -> Dict:
        """
        发送文本卡片消息
        
        Args:
            title: 标题
            description: 描述
            url: 点击后跳转的链接
            btntxt: 按钮文字
            user_ids: 用户ID列表
            department_ids: 部门ID列表
            to_all: 是否发送给所有人
            
        Returns:
            发送结果
        """
        try:
            # 获取访问令牌
            access_token = self.token_manager.get_access_token()
            
            # 构建接收者
            touser = '@all' if to_all else '|'.join(user_ids or [])
            toparty = '|'.join(str(d) for d in (department_ids or []))
            
            # 构建消息体
            message = {
                'touser': touser,
                'toparty': toparty,
                'msgtype': self.MSG_TYPE_TEXTCARD,
                'agentid': self.agent_id,
                'textcard': {
                    'title': title,
                    'description': description,
                    'url': url,
                    'btntxt': btntxt
                }
            }
            
            # 发送消息
            api_url = f'{self.API_BASE_URL}/message/send?access_token={access_token}'
            response = requests.post(api_url, json=message, timeout=10)
            result = response.json()
            
            if result.get('errcode') == 0:
                logger.info(f"企业微信卡片消息发送成功: {title}")
                return {
                    'success': True,
                    'invaliduser': result.get('invaliduser', ''),
                    'invalidparty': result.get('invalidparty', '')
                }
            else:
                logger.error(f"企业微信卡片消息发送失败: {result}")
                return {
                    'success': False,
                    'error': result.get('errmsg', '未知错误')
                }
                
        except Exception as e:
            logger.error(f"发送企业微信卡片消息异常: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    def notify_plan_published(self, plan, user_ids: Optional[List[str]] = None):
        """
        通知计划已发布
        
        Args:
            plan: 计划对象
            user_ids: 接收通知的用户ID列表
        """
        title = '开店计划已发布'
        description = f"""计划名称：{plan.name}
计划周期：{plan.start_date} 至 {plan.end_date}
目标数量：{plan.total_target_count} 家
发布时间：{plan.published_at.strftime('%Y-%m-%d %H:%M')}

请及时查看并开始执行。"""
        
        # 构建详情链接
        detail_url = f"{settings.FRONTEND_URL}/mobile/plans/{plan.id}"
        
        return self.send_textcard_message(
            title=title,
            description=description,
            url=detail_url,
            btntxt='查看详情',
            user_ids=user_ids
        )
    
    def notify_plan_cancelled(self, plan, user_ids: Optional[List[str]] = None):
        """
        通知计划已取消
        
        Args:
            plan: 计划对象
            user_ids: 接收通知的用户ID列表
        """
        title = '开店计划已取消'
        description = f"""计划名称：{plan.name}
取消时间：{plan.cancelled_at.strftime('%Y-%m-%d %H:%M')}
取消原因：{plan.cancel_reason or '未说明'}

请知悉。"""
        
        detail_url = f"{settings.FRONTEND_URL}/mobile/plans/{plan.id}"
        
        return self.send_textcard_message(
            title=title,
            description=description,
            url=detail_url,
            btntxt='查看详情',
            user_ids=user_ids
        )
    
    def notify_plan_alert(
        self,
        plan,
        alert_type: str,
        alert_message: str,
        user_ids: Optional[List[str]] = None
    ):
        """
        发送计划预警通知
        
        Args:
            plan: 计划对象
            alert_type: 预警类型
            alert_message: 预警消息
            user_ids: 接收通知的用户ID列表
        """
        title = '⚠️ 开店计划预警'
        
        # 计算完成率
        completion_rate = 0
        if plan.total_target_count > 0:
            completion_rate = round(
                (plan.total_completed_count / plan.total_target_count) * 100,
                1
            )
        
        description = f"""计划名称：{plan.name}
预警类型：{alert_type}
预警信息：{alert_message}

当前进度：{plan.total_completed_count}/{plan.total_target_count} ({completion_rate}%)

请及时关注并采取措施。"""
        
        detail_url = f"{settings.FRONTEND_URL}/mobile/plans/{plan.id}"
        
        return self.send_textcard_message(
            title=title,
            description=description,
            url=detail_url,
            btntxt='查看详情',
            user_ids=user_ids
        )
    
    def notify_progress_update(
        self,
        plan,
        region_name: str,
        store_type_name: str,
        user_ids: Optional[List[str]] = None
    ):
        """
        通知计划进度更新
        
        Args:
            plan: 计划对象
            region_name: 区域名称
            store_type_name: 门店类型名称
            user_ids: 接收通知的用户ID列表
        """
        # 计算完成率
        completion_rate = 0
        if plan.total_target_count > 0:
            completion_rate = round(
                (plan.total_completed_count / plan.total_target_count) * 100,
                1
            )
        
        content = f"""【开店计划进度更新】

计划名称：{plan.name}
更新区域：{region_name} - {store_type_name}
当前进度：{plan.total_completed_count}/{plan.total_target_count} ({completion_rate}%)

恭喜！又完成了一家门店的开业。"""
        
        return self.send_text_message(
            content=content,
            user_ids=user_ids
        )


# 全局服务实例
wechat_notification_service = WeChatNotificationService()
