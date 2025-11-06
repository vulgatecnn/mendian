"""
业务指标告警规则配置
"""
from datetime import timedelta
from django.utils import timezone
from typing import Dict, List, Any


class BusinessMetricsAlertRules:
    """业务指标告警规则"""
    
    def __init__(self):
        # 告警规则配置
        self.rules = {
            # 门店开业进度告警
            'store_opening_progress': {
                'enabled': True,
                'check_interval': 24,  # 小时
                'rules': [
                    {
                        'name': '开店计划完成率过低',
                        'condition': 'completion_rate < 70',
                        'level': 'warning',
                        'message': '开店计划完成率低于70%，当前完成率: {completion_rate}%'
                    },
                    {
                        'name': '开店计划严重滞后',
                        'condition': 'completion_rate < 50',
                        'level': 'critical',
                        'message': '开店计划严重滞后，完成率仅为: {completion_rate}%'
                    }
                ]
            },
            
            # 跟进转化率告警
            'follow_up_conversion': {
                'enabled': True,
                'check_interval': 12,  # 小时
                'rules': [
                    {
                        'name': '跟进转化率异常',
                        'condition': 'conversion_rate < 20',
                        'level': 'warning',
                        'message': '跟进转化率异常低，当前转化率: {conversion_rate}%'
                    },
                    {
                        'name': '跟进流程停滞',
                        'condition': 'days_without_progress > 7',
                        'level': 'warning',
                        'message': '跟进流程停滞超过7天，停滞天数: {days_without_progress}天'
                    }
                ]
            },
            
            # 筹备进度告警
            'preparation_progress': {
                'enabled': True,
                'check_interval': 24,  # 小时
                'rules': [
                    {
                        'name': '筹备工程延期',
                        'condition': 'overdue_projects > 0',
                        'level': 'warning',
                        'message': '有{overdue_projects}个筹备工程项目延期'
                    },
                    {
                        'name': '筹备工程严重延期',
                        'condition': 'severely_overdue_projects > 0',
                        'level': 'critical',
                        'message': '有{severely_overdue_projects}个筹备工程项目严重延期（超过30天）'
                    }
                ]
            },
            
            # ROI异常告警
            'roi_anomaly': {
                'enabled': True,
                'check_interval': 24,  # 小时
                'rules': [
                    {
                        'name': '门店ROI低于预期',
                        'condition': 'actual_roi < expected_roi * 0.7',
                        'level': 'warning',
                        'message': '门店ROI低于预期70%，实际ROI: {actual_roi}%, 预期ROI: {expected_roi}%'
                    },
                    {
                        'name': '门店ROI严重偏低',
                        'condition': 'actual_roi < expected_roi * 0.5',
                        'level': 'critical',
                        'message': '门店ROI严重偏低，实际ROI: {actual_roi}%, 预期ROI: {expected_roi}%'
                    },
                    {
                        'name': '门店连续亏损',
                        'condition': 'consecutive_loss_months >= 3',
                        'level': 'critical',
                        'message': '门店连续{consecutive_loss_months}个月亏损'
                    }
                ]
            },
            
            # 数据质量告警
            'data_quality': {
                'enabled': True,
                'check_interval': 6,  # 小时
                'rules': [
                    {
                        'name': '外部数据同步失败',
                        'condition': 'sync_failure_rate > 10',
                        'level': 'warning',
                        'message': '外部数据同步失败率过高: {sync_failure_rate}%'
                    },
                    {
                        'name': '数据缺失严重',
                        'condition': 'missing_data_rate > 20',
                        'level': 'critical',
                        'message': '数据缺失率严重: {missing_data_rate}%'
                    },
                    {
                        'name': '数据更新延迟',
                        'condition': 'data_delay_hours > 24',
                        'level': 'warning',
                        'message': '数据更新延迟超过24小时，当前延迟: {data_delay_hours}小时'
                    }
                ]
            },
            
            # 报表生成告警
            'report_generation': {
                'enabled': True,
                'check_interval': 2,  # 小时
                'rules': [
                    {
                        'name': '报表生成失败率高',
                        'condition': 'report_failure_rate > 15',
                        'level': 'warning',
                        'message': '报表生成失败率过高: {report_failure_rate}%'
                    },
                    {
                        'name': '报表生成时间过长',
                        'condition': 'avg_generation_time > 300',
                        'level': 'warning',
                        'message': '报表平均生成时间过长: {avg_generation_time}秒'
                    },
                    {
                        'name': '定时报表未生成',
                        'condition': 'missed_scheduled_reports > 0',
                        'level': 'critical',
                        'message': '有{missed_scheduled_reports}个定时报表未按时生成'
                    }
                ]
            }
        }
    
    def get_enabled_rules(self) -> Dict[str, Any]:
        """获取启用的告警规则"""
        return {
            rule_type: config 
            for rule_type, config in self.rules.items() 
            if config.get('enabled', False)
        }
    
    def should_check_rule(self, rule_type: str, last_check_time: timezone.datetime = None) -> bool:
        """判断是否应该检查某个规则"""
        if rule_type not in self.rules:
            return False
        
        rule_config = self.rules[rule_type]
        if not rule_config.get('enabled', False):
            return False
        
        if last_check_time is None:
            return True
        
        check_interval = rule_config.get('check_interval', 24)  # 默认24小时
        time_since_last_check = timezone.now() - last_check_time
        
        return time_since_last_check >= timedelta(hours=check_interval)
    
    def evaluate_rule(self, rule_type: str, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """评估告警规则"""
        if rule_type not in self.rules:
            return []
        
        rule_config = self.rules[rule_type]
        if not rule_config.get('enabled', False):
            return []
        
        alerts = []
        
        for rule in rule_config.get('rules', []):
            try:
                # 评估条件
                condition = rule['condition']
                
                # 替换条件中的变量
                for key, value in metrics.items():
                    condition = condition.replace(key, str(value))
                
                # 安全地评估条件
                if self._safe_eval(condition, metrics):
                    alert = {
                        'type': rule_type,
                        'rule_name': rule['name'],
                        'level': rule['level'],
                        'message': rule['message'].format(**metrics),
                        'timestamp': timezone.now().isoformat(),
                        'metrics': metrics,
                        'condition': rule['condition']
                    }
                    alerts.append(alert)
                    
            except Exception as e:
                # 记录规则评估错误，但不中断其他规则的评估
                error_alert = {
                    'type': 'rule_evaluation_error',
                    'rule_name': f"{rule_type}.{rule['name']}",
                    'level': 'warning',
                    'message': f'告警规则评估失败: {str(e)}',
                    'timestamp': timezone.now().isoformat(),
                    'error': str(e)
                }
                alerts.append(error_alert)
        
        return alerts
    
    def _safe_eval(self, condition: str, context: Dict[str, Any]) -> bool:
        """安全地评估条件表达式"""
        try:
            # 只允许基本的比较操作
            allowed_operators = ['<', '>', '<=', '>=', '==', '!=', 'and', 'or', 'not']
            
            # 检查条件中是否只包含允许的操作符
            import re
            tokens = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*|[<>=!]+|and|or|not|\d+\.?\d*', condition)
            
            for token in tokens:
                if token not in allowed_operators and not token.replace('.', '').replace('_', '').isalnum():
                    if token not in context and not token.replace('.', '').isdigit():
                        return False
            
            # 创建安全的评估环境
            safe_dict = {
                '__builtins__': {},
                **context
            }
            
            return eval(condition, safe_dict)
            
        except Exception:
            return False
    
    def get_rule_config(self, rule_type: str) -> Dict[str, Any]:
        """获取特定规则的配置"""
        return self.rules.get(rule_type, {})
    
    def update_rule_config(self, rule_type: str, config: Dict[str, Any]) -> bool:
        """更新规则配置"""
        try:
            if rule_type in self.rules:
                self.rules[rule_type].update(config)
                return True
            return False
        except Exception:
            return False
    
    def add_custom_rule(self, rule_type: str, rule_config: Dict[str, Any]) -> bool:
        """添加自定义规则"""
        try:
            # 验证规则配置的基本结构
            required_fields = ['enabled', 'check_interval', 'rules']
            if not all(field in rule_config for field in required_fields):
                return False
            
            # 验证规则列表
            for rule in rule_config['rules']:
                required_rule_fields = ['name', 'condition', 'level', 'message']
                if not all(field in rule for field in required_rule_fields):
                    return False
            
            self.rules[rule_type] = rule_config
            return True
            
        except Exception:
            return False
    
    def disable_rule(self, rule_type: str) -> bool:
        """禁用规则"""
        if rule_type in self.rules:
            self.rules[rule_type]['enabled'] = False
            return True
        return False
    
    def enable_rule(self, rule_type: str) -> bool:
        """启用规则"""
        if rule_type in self.rules:
            self.rules[rule_type]['enabled'] = True
            return True
        return False


# 全局告警规则实例
alert_rules = BusinessMetricsAlertRules()