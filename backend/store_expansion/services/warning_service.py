"""
低贡献率预警服务
"""
from typing import Dict, Any, Optional
from decimal import Decimal
from django.db.models import Q
from ..models import FollowUpRecord


class LowContributionWarningService:
    """
    低贡献率预警服务
    
    用于检查和预警低贡献率门店数量是否达到计划红线
    """
    
    # 默认贡献率阈值（低于此值视为低贡献率门店）
    DEFAULT_CONTRIBUTION_THRESHOLD = Decimal('10.0')  # 10%
    
    # 默认最大低贡献率门店数量
    DEFAULT_MAX_LOW_CONTRIBUTION_STORES = 5
    
    def __init__(self):
        """初始化预警服务"""
        pass
    
    def check_warning(
        self,
        business_region_id: int,
        new_contribution_rate: Decimal,
        plan_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        检查是否触发低贡献率预警
        
        Args:
            business_region_id: 业务大区ID
            new_contribution_rate: 新门店的贡献率
            plan_config: 计划配置，包含：
                - contribution_threshold: 贡献率阈值
                - max_low_contribution_stores: 最大低贡献率门店数量
        
        Returns:
            预警信息字典，包含：
                - has_warning: 是否有预警
                - message: 预警消息
                - current_count: 当前低贡献率门店数量
                - max_count: 最大允许数量
                - threshold: 贡献率阈值
        """
        # 获取计划配置
        if plan_config is None:
            plan_config = self._get_default_plan_config()
        
        contribution_threshold = Decimal(str(plan_config.get(
            'contribution_threshold',
            self.DEFAULT_CONTRIBUTION_THRESHOLD
        )))
        max_low_contribution_stores = plan_config.get(
            'max_low_contribution_stores',
            self.DEFAULT_MAX_LOW_CONTRIBUTION_STORES
        )
        
        # 统计当前低贡献率门店数量
        current_count = self._count_low_contribution_stores(
            business_region_id,
            contribution_threshold
        )
        
        # 如果新门店也是低贡献率，则计数加1
        if new_contribution_rate < contribution_threshold:
            current_count += 1
        
        # 检查是否达到红线
        has_warning = current_count >= max_low_contribution_stores
        
        result = {
            'has_warning': has_warning,
            'current_count': current_count,
            'max_count': max_low_contribution_stores,
            'threshold': float(contribution_threshold),
            'new_contribution_rate': float(new_contribution_rate),
        }
        
        if has_warning:
            result['message'] = (
                f'该大区低贡献率门店已达 {current_count} 家，'
                f'接近或超过计划红线（{max_low_contribution_stores} 家）。'
                f'贡献率阈值：{contribution_threshold}%'
            )
            result['warning_level'] = 'high' if current_count > max_low_contribution_stores else 'medium'
        else:
            result['message'] = (
                f'该大区当前有 {current_count} 家低贡献率门店，'
                f'未达到预警红线（{max_low_contribution_stores} 家）。'
            )
            result['warning_level'] = 'low'
        
        return result
    
    def _count_low_contribution_stores(
        self,
        business_region_id: int,
        contribution_threshold: Decimal
    ) -> int:
        """
        统计指定大区的低贡献率门店数量
        
        Args:
            business_region_id: 业务大区ID
            contribution_threshold: 贡献率阈值
        
        Returns:
            低贡献率门店数量
        """
        # 查询已签约且有盈利测算的跟进单
        count = FollowUpRecord.objects.filter(
            location__business_region_id=business_region_id,
            status=FollowUpRecord.STATUS_SIGNED,
            profit_calculation__isnull=False,
            profit_calculation__contribution_rate__lt=contribution_threshold
        ).count()
        
        return count
    
    def _get_default_plan_config(self) -> Dict[str, Any]:
        """
        获取默认计划配置
        
        Returns:
            默认计划配置字典
        """
        return {
            'contribution_threshold': self.DEFAULT_CONTRIBUTION_THRESHOLD,
            'max_low_contribution_stores': self.DEFAULT_MAX_LOW_CONTRIBUTION_STORES
        }
    
    def get_region_plan_config(self, business_region_id: int) -> Dict[str, Any]:
        """
        获取指定大区的计划配置
        
        Args:
            business_region_id: 业务大区ID
        
        Returns:
            计划配置字典
        """
        # TODO: 从数据库中加载大区的计划配置
        # 目前返回默认配置
        return self._get_default_plan_config()
    
    def get_low_contribution_stores(
        self,
        business_region_id: int,
        contribution_threshold: Optional[Decimal] = None
    ) -> list:
        """
        获取指定大区的低贡献率门店列表
        
        Args:
            business_region_id: 业务大区ID
            contribution_threshold: 贡献率阈值（可选）
        
        Returns:
            低贡献率门店列表
        """
        if contribution_threshold is None:
            contribution_threshold = self.DEFAULT_CONTRIBUTION_THRESHOLD
        
        # 查询低贡献率门店
        follow_ups = FollowUpRecord.objects.filter(
            location__business_region_id=business_region_id,
            status=FollowUpRecord.STATUS_SIGNED,
            profit_calculation__isnull=False,
            profit_calculation__contribution_rate__lt=contribution_threshold
        ).select_related(
            'location',
            'profit_calculation'
        ).order_by('profit_calculation__contribution_rate')
        
        # 构建返回数据
        stores = []
        for follow_up in follow_ups:
            stores.append({
                'follow_up_id': follow_up.id,
                'record_no': follow_up.record_no,
                'location_name': follow_up.location.name,
                'location_address': f"{follow_up.location.city}{follow_up.location.district}{follow_up.location.address}",
                'contribution_rate': float(follow_up.profit_calculation.contribution_rate),
                'roi': float(follow_up.profit_calculation.roi),
                'payback_period': follow_up.profit_calculation.payback_period,
                'contract_date': follow_up.contract_date.isoformat() if follow_up.contract_date else None,
            })
        
        return stores
    
    def generate_warning_report(self, business_region_id: int) -> Dict[str, Any]:
        """
        生成预警报告
        
        Args:
            business_region_id: 业务大区ID
        
        Returns:
            预警报告字典
        """
        plan_config = self.get_region_plan_config(business_region_id)
        contribution_threshold = Decimal(str(plan_config.get(
            'contribution_threshold',
            self.DEFAULT_CONTRIBUTION_THRESHOLD
        )))
        
        # 获取低贡献率门店列表
        low_contribution_stores = self.get_low_contribution_stores(
            business_region_id,
            contribution_threshold
        )
        
        # 统计信息
        total_signed_stores = FollowUpRecord.objects.filter(
            location__business_region_id=business_region_id,
            status=FollowUpRecord.STATUS_SIGNED
        ).count()
        
        low_contribution_count = len(low_contribution_stores)
        low_contribution_ratio = (
            (low_contribution_count / total_signed_stores * 100)
            if total_signed_stores > 0 else 0
        )
        
        # 生成报告
        report = {
            'business_region_id': business_region_id,
            'contribution_threshold': float(contribution_threshold),
            'total_signed_stores': total_signed_stores,
            'low_contribution_count': low_contribution_count,
            'low_contribution_ratio': round(low_contribution_ratio, 2),
            'max_allowed_count': plan_config.get('max_low_contribution_stores'),
            'stores': low_contribution_stores,
        }
        
        # 添加预警状态
        if low_contribution_count >= plan_config.get('max_low_contribution_stores'):
            report['warning_status'] = 'critical'
            report['warning_message'] = '低贡献率门店数量已达到或超过红线，请注意控制！'
        elif low_contribution_count >= plan_config.get('max_low_contribution_stores') * 0.8:
            report['warning_status'] = 'warning'
            report['warning_message'] = '低贡献率门店数量接近红线，请密切关注！'
        else:
            report['warning_status'] = 'normal'
            report['warning_message'] = '低贡献率门店数量在正常范围内。'
        
        return report
