"""
数据分析工具模块
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class DataValidator:
    """数据验证器"""
    
    @staticmethod
    def validate_sales_data(data: Dict) -> Dict:
        """
        验证销售数据格式
        
        Args:
            data: 销售数据字典
            
        Returns:
            验证后的数据字典
            
        Raises:
            ValidationError: 数据格式不正确时抛出
        """
        try:
            # 检查必需字段
            required_fields = ['store_id', 'data_date', 'daily_revenue']
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"缺少必需字段: {field}")
            
            # 验证门店ID
            try:
                store_id = int(data['store_id'])
                if store_id <= 0:
                    raise ValidationError("门店ID必须为正整数")
                data['store_id'] = store_id
            except (ValueError, TypeError):
                raise ValidationError("门店ID格式不正确")
            
            # 验证日期格式
            try:
                if isinstance(data['data_date'], str):
                    data['data_date'] = datetime.strptime(data['data_date'], '%Y-%m-%d').date()
                elif not hasattr(data['data_date'], 'year'):
                    raise ValidationError("日期格式不正确")
            except ValueError:
                raise ValidationError("日期格式不正确，应为YYYY-MM-DD")
            
            # 验证收入数据
            try:
                daily_revenue = Decimal(str(data['daily_revenue']))
                if daily_revenue < 0:
                    raise ValidationError("日营业额不能为负数")
                data['daily_revenue'] = daily_revenue
            except (ValueError, InvalidOperation):
                raise ValidationError("日营业额格式不正确")
            
            # 验证可选字段
            optional_fields = ['daily_orders', 'monthly_revenue', 'monthly_orders']
            for field in optional_fields:
                if field in data:
                    try:
                        if 'revenue' in field:
                            value = Decimal(str(data[field]))
                        else:
                            value = int(data[field])
                        
                        if value < 0:
                            raise ValidationError(f"{field}不能为负数")
                        data[field] = value
                    except (ValueError, InvalidOperation):
                        raise ValidationError(f"{field}格式不正确")
            
            return data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"销售数据验证失败: {e}")
            raise ValidationError(f"数据验证失败: {e}")
    
    @staticmethod
    def validate_date_range(start_date: Any, end_date: Any) -> Tuple[datetime, datetime]:
        """
        验证日期范围
        
        Args:
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            验证后的日期元组
            
        Raises:
            ValidationError: 日期格式不正确时抛出
        """
        try:
            # 转换开始日期
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
            elif hasattr(start_date, 'date'):
                start_date = datetime.combine(start_date.date(), datetime.min.time())
            elif not isinstance(start_date, datetime):
                raise ValidationError("开始日期格式不正确")
            
            # 转换结束日期
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
            elif hasattr(end_date, 'date'):
                end_date = datetime.combine(end_date.date(), datetime.max.time())
            elif not isinstance(end_date, datetime):
                raise ValidationError("结束日期格式不正确")
            
            # 验证日期范围
            if start_date >= end_date:
                raise ValidationError("开始日期必须早于结束日期")
            
            # 验证日期范围不能太大（最多1年）
            if (end_date - start_date).days > 365:
                raise ValidationError("日期范围不能超过1年")
            
            return start_date, end_date
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"日期范围验证失败: {e}")
            raise ValidationError(f"日期范围验证失败: {e}")
    
    @staticmethod
    def validate_region_id(region_id: Any) -> Optional[int]:
        """
        验证区域ID
        
        Args:
            region_id: 区域ID
            
        Returns:
            验证后的区域ID，None表示不筛选
            
        Raises:
            ValidationError: 区域ID格式不正确时抛出
        """
        if region_id is None or region_id == '':
            return None
        
        try:
            region_id = int(region_id)
            if region_id <= 0:
                raise ValidationError("区域ID必须为正整数")
            return region_id
        except (ValueError, TypeError):
            raise ValidationError("区域ID格式不正确")


class DataCleaner:
    """数据清洗器"""
    
    @staticmethod
    def clean_store_data(store_data: Dict) -> Dict:
        """
        清洗门店数据
        
        Args:
            store_data: 原始门店数据
            
        Returns:
            清洗后的门店数据
        """
        try:
            cleaned_data = store_data.copy()
            
            # 清洗地址信息
            address_fields = ['province', 'city', 'district', 'address']
            for field in address_fields:
                if field in cleaned_data and cleaned_data[field]:
                    # 去除多余空格
                    cleaned_data[field] = str(cleaned_data[field]).strip()
                    # 统一省份名称格式
                    if field == 'province' and not cleaned_data[field].endswith('省'):
                        if cleaned_data[field] not in ['北京', '上海', '天津', '重庆']:
                            cleaned_data[field] += '省'
            
            # 清洗门店名称
            if 'name' in cleaned_data and cleaned_data['name']:
                cleaned_data['name'] = str(cleaned_data['name']).strip()
            
            # 清洗状态信息
            if 'status' in cleaned_data:
                status_mapping = {
                    '规划中': 'planning',
                    '施工中': 'construction',
                    '筹备中': 'preparing',
                    '营业中': 'operating',
                    '已闭店': 'closed',
                }
                if cleaned_data['status'] in status_mapping:
                    cleaned_data['status'] = status_mapping[cleaned_data['status']]
            
            return cleaned_data
            
        except Exception as e:
            logger.error(f"门店数据清洗失败: {e}")
            return store_data
    
    @staticmethod
    def clean_financial_data(financial_data: Dict) -> Dict:
        """
        清洗财务数据
        
        Args:
            financial_data: 原始财务数据
            
        Returns:
            清洗后的财务数据
        """
        try:
            cleaned_data = financial_data.copy()
            
            # 清洗金额字段
            amount_fields = ['revenue', 'cost', 'profit', 'investment']
            for field in amount_fields:
                if field in cleaned_data and cleaned_data[field] is not None:
                    try:
                        # 转换为Decimal类型
                        amount = Decimal(str(cleaned_data[field]))
                        # 保留2位小数
                        cleaned_data[field] = amount.quantize(Decimal('0.01'))
                    except (ValueError, InvalidOperation):
                        logger.warning(f"无效的金额数据: {field}={cleaned_data[field]}")
                        cleaned_data[field] = Decimal('0.00')
            
            # 清洗百分比字段
            percentage_fields = ['roi', 'completion_rate', 'conversion_rate']
            for field in percentage_fields:
                if field in cleaned_data and cleaned_data[field] is not None:
                    try:
                        percentage = float(cleaned_data[field])
                        # 限制在合理范围内
                        if percentage < 0:
                            percentage = 0
                        elif percentage > 1000:  # 允许超过100%的情况
                            percentage = 1000
                        cleaned_data[field] = round(percentage, 2)
                    except (ValueError, TypeError):
                        logger.warning(f"无效的百分比数据: {field}={cleaned_data[field]}")
                        cleaned_data[field] = 0.0
            
            return cleaned_data
            
        except Exception as e:
            logger.error(f"财务数据清洗失败: {e}")
            return financial_data


class DataFormatter:
    """数据格式化器"""
    
    @staticmethod
    def format_currency(amount: Decimal, currency: str = '¥') -> str:
        """
        格式化货币金额
        
        Args:
            amount: 金额
            currency: 货币符号
            
        Returns:
            格式化后的货币字符串
        """
        try:
            if amount is None:
                return f"{currency}0.00"
            
            # 转换为Decimal确保精度
            if not isinstance(amount, Decimal):
                amount = Decimal(str(amount))
            
            # 格式化为千分位分隔
            formatted = f"{amount:,.2f}"
            return f"{currency}{formatted}"
            
        except Exception as e:
            logger.error(f"货币格式化失败: {e}")
            return f"{currency}0.00"
    
    @staticmethod
    def format_percentage(value: float, decimal_places: int = 2) -> str:
        """
        格式化百分比
        
        Args:
            value: 百分比值
            decimal_places: 小数位数
            
        Returns:
            格式化后的百分比字符串
        """
        try:
            if value is None:
                return "0.00%"
            
            formatted = f"{value:.{decimal_places}f}%"
            return formatted
            
        except Exception as e:
            logger.error(f"百分比格式化失败: {e}")
            return "0.00%"
    
    @staticmethod
    def format_date(date_obj: Any, format_str: str = '%Y-%m-%d') -> str:
        """
        格式化日期
        
        Args:
            date_obj: 日期对象
            format_str: 格式字符串
            
        Returns:
            格式化后的日期字符串
        """
        try:
            if date_obj is None:
                return ""
            
            if isinstance(date_obj, str):
                return date_obj
            
            if hasattr(date_obj, 'strftime'):
                return date_obj.strftime(format_str)
            
            return str(date_obj)
            
        except Exception as e:
            logger.error(f"日期格式化失败: {e}")
            return ""
    
    @staticmethod
    def format_number(number: Any, decimal_places: int = 0) -> str:
        """
        格式化数字
        
        Args:
            number: 数字
            decimal_places: 小数位数
            
        Returns:
            格式化后的数字字符串
        """
        try:
            if number is None:
                return "0"
            
            if decimal_places > 0:
                formatted = f"{float(number):,.{decimal_places}f}"
            else:
                formatted = f"{int(number):,}"
            
            return formatted
            
        except Exception as e:
            logger.error(f"数字格式化失败: {e}")
            return "0"


class CacheKeyGenerator:
    """缓存键生成器"""
    
    @staticmethod
    def generate_cache_key(prefix: str, **kwargs) -> str:
        """
        生成缓存键
        
        Args:
            prefix: 缓存键前缀
            **kwargs: 缓存键参数
            
        Returns:
            生成的缓存键
        """
        key_parts = [prefix]
        
        # 按键名排序确保一致性
        for key, value in sorted(kwargs.items()):
            if value is not None:
                # 处理不同类型的值
                if isinstance(value, (list, tuple)):
                    value_str = '_'.join(str(v) for v in value)
                elif isinstance(value, datetime):
                    value_str = value.strftime('%Y%m%d')
                else:
                    value_str = str(value)
                
                key_parts.append(f"{key}_{value_str}")
        
        return ':'.join(key_parts)
    
    @staticmethod
    def generate_report_cache_key(report_type: str, filters: Dict) -> str:
        """
        生成报表缓存键
        
        Args:
            report_type: 报表类型
            filters: 筛选条件
            
        Returns:
            报表缓存键
        """
        return CacheKeyGenerator.generate_cache_key(
            f"report_{report_type}",
            **filters
        )


def calculate_time_range_from_period(period: str) -> Tuple[datetime, datetime]:
    """
    根据时间周期计算时间范围
    
    Args:
        period: 时间周期 ('today', 'week', 'month', 'quarter', 'year')
        
    Returns:
        时间范围元组 (start_date, end_date)
    """
    now = timezone.now()
    
    if period == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    elif period == 'week':
        # 本周（周一到周日）
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = (start_date + timedelta(days=6)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
    
    elif period == 'month':
        # 本月
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1)
        else:
            next_month = now.replace(month=now.month + 1, day=1)
        end_date = (next_month - timedelta(days=1)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
    
    elif period == 'quarter':
        # 本季度
        quarter = (now.month - 1) // 3 + 1
        start_month = (quarter - 1) * 3 + 1
        start_date = now.replace(month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if quarter == 4:
            end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_month = quarter * 3 + 1
            end_date = now.replace(month=end_month, day=1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    elif period == 'year':
        # 本年
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    
    else:
        # 默认为今天
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return start_date, end_date