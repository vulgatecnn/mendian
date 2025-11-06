"""
盈利测算引擎服务
"""
from decimal import Decimal
from typing import Dict, Any
from ..models import ProfitCalculation


class ProfitCalculationEngine:
    """
    盈利测算引擎
    
    支持可配置的计算公式，用于计算门店的投资回报率、回本周期和贡献率
    """
    
    # 默认公式版本
    DEFAULT_FORMULA_VERSION = 'v1.0'
    
    # 默认计算参数
    DEFAULT_PARAMS = {
        'cost_rate': 0.35,          # 成本率（35%）
        'expense_rate': 0.25,       # 费用率（25%）
        'tax_rate': 0.06,           # 税率（6%）
        'months_per_year': 12,      # 每年月数
    }
    
    def __init__(self, formula_config: Dict[str, Any] = None):
        """
        初始化计算引擎
        
        Args:
            formula_config: 公式配置字典，包含 version 和 params
        """
        if formula_config is None:
            formula_config = {
                'version': self.DEFAULT_FORMULA_VERSION,
                'params': self.DEFAULT_PARAMS.copy()
            }
        
        self.formula_version = formula_config.get('version', self.DEFAULT_FORMULA_VERSION)
        self.params = formula_config.get('params', self.DEFAULT_PARAMS.copy())
    
    def calculate(
        self,
        business_terms: Dict[str, Any],
        sales_forecast: Dict[str, Any]
    ) -> ProfitCalculation:
        """
        执行盈利测算
        
        Args:
            business_terms: 商务条件数据，包含：
                - rent_cost: 租金成本
                - decoration_cost: 装修成本
                - equipment_cost: 设备成本
                - other_cost: 其他成本（可选）
            sales_forecast: 销售预测数据，包含：
                - daily_sales: 日均销售额
                - monthly_sales: 月均销售额
        
        Returns:
            ProfitCalculation: 盈利测算对象
        """
        # 提取数据
        rent_cost = Decimal(str(business_terms.get('rent_cost', 0)))
        decoration_cost = Decimal(str(business_terms.get('decoration_cost', 0)))
        equipment_cost = Decimal(str(business_terms.get('equipment_cost', 0)))
        other_cost = Decimal(str(business_terms.get('other_cost', 0)))
        
        daily_sales = Decimal(str(sales_forecast.get('daily_sales', 0)))
        monthly_sales = Decimal(str(sales_forecast.get('monthly_sales', 0)))
        
        # 计算总投资
        total_investment = rent_cost + decoration_cost + equipment_cost + other_cost
        
        # 计算月均利润
        monthly_profit = self._calculate_monthly_profit(
            monthly_sales,
            rent_cost,
            self.params
        )
        
        # 计算投资回报率（年化）
        roi = self._calculate_roi(monthly_profit, total_investment, self.params)
        
        # 计算回本周期（月）
        payback_period = self._calculate_payback_period(total_investment, monthly_profit)
        
        # 计算贡献率
        contribution_rate = self._calculate_contribution_rate(
            monthly_profit,
            monthly_sales,
            self.params
        )
        
        # 创建盈利测算对象
        # 将params中的Decimal转换为float，以便JSON序列化
        json_safe_params = {
            key: float(value) if isinstance(value, Decimal) else value
            for key, value in self.params.items()
        }
        
        calculation = ProfitCalculation(
            rent_cost=rent_cost,
            decoration_cost=decoration_cost,
            equipment_cost=equipment_cost,
            other_cost=other_cost,
            daily_sales=daily_sales,
            monthly_sales=monthly_sales,
            total_investment=total_investment,
            roi=roi,
            payback_period=payback_period,
            contribution_rate=contribution_rate,
            formula_version=self.formula_version,
            calculation_params=json_safe_params
        )
        
        return calculation
    
    def _calculate_monthly_profit(
        self,
        monthly_sales: Decimal,
        rent_cost: Decimal,
        params: Dict[str, Any]
    ) -> Decimal:
        """
        计算月均利润
        
        公式：月均利润 = 月销售额 × (1 - 成本率 - 费用率 - 税率) - 租金
        
        Args:
            monthly_sales: 月均销售额
            rent_cost: 月租金
            params: 计算参数
        
        Returns:
            月均利润
        """
        cost_rate = Decimal(str(params.get('cost_rate', 0.35)))
        expense_rate = Decimal(str(params.get('expense_rate', 0.25)))
        tax_rate = Decimal(str(params.get('tax_rate', 0.06)))
        
        # 毛利润 = 销售额 × (1 - 成本率 - 费用率 - 税率)
        gross_profit = monthly_sales * (Decimal('1') - cost_rate - expense_rate - tax_rate)
        
        # 净利润 = 毛利润 - 租金
        net_profit = gross_profit - rent_cost
        
        return net_profit
    
    def _calculate_roi(
        self,
        monthly_profit: Decimal,
        total_investment: Decimal,
        params: Dict[str, Any]
    ) -> Decimal:
        """
        计算投资回报率（年化）
        
        公式：ROI = (月均利润 × 12 / 总投资) × 100%
        
        Args:
            monthly_profit: 月均利润
            total_investment: 总投资
            params: 计算参数
        
        Returns:
            投资回报率（百分比）
        """
        if total_investment <= 0:
            return Decimal('0')
        
        months_per_year = Decimal(str(params.get('months_per_year', 12)))
        annual_profit = monthly_profit * months_per_year
        roi = (annual_profit / total_investment) * Decimal('100')
        
        # 保留两位小数
        return roi.quantize(Decimal('0.01'))
    
    def _calculate_payback_period(
        self,
        total_investment: Decimal,
        monthly_profit: Decimal
    ) -> int:
        """
        计算回本周期（月）
        
        公式：回本周期 = 总投资 / 月均利润
        
        Args:
            total_investment: 总投资
            monthly_profit: 月均利润
        
        Returns:
            回本周期（月，向上取整）
        """
        if monthly_profit <= 0:
            return 999  # 如果月利润为负或零，返回一个很大的数字表示无法回本
        
        payback_period = total_investment / monthly_profit
        
        # 向上取整
        import math
        return math.ceil(float(payback_period))
    
    def _calculate_contribution_rate(
        self,
        monthly_profit: Decimal,
        monthly_sales: Decimal,
        params: Dict[str, Any]
    ) -> Decimal:
        """
        计算贡献率
        
        公式：贡献率 = (月均利润 / 月均销售额) × 100%
        
        Args:
            monthly_profit: 月均利润
            monthly_sales: 月均销售额
            params: 计算参数
        
        Returns:
            贡献率（百分比）
        """
        if monthly_sales <= 0:
            return Decimal('0')
        
        contribution_rate = (monthly_profit / monthly_sales) * Decimal('100')
        
        # 保留两位小数
        return contribution_rate.quantize(Decimal('0.01'))
    
    @classmethod
    def get_default_config(cls) -> Dict[str, Any]:
        """
        获取默认公式配置
        
        Returns:
            默认公式配置字典
        """
        return {
            'version': cls.DEFAULT_FORMULA_VERSION,
            'params': cls.DEFAULT_PARAMS.copy()
        }
    
    @classmethod
    def validate_config(cls, config: Dict[str, Any]) -> bool:
        """
        验证公式配置的有效性
        
        Args:
            config: 公式配置字典
        
        Returns:
            配置是否有效
        """
        if not isinstance(config, dict):
            return False
        
        if 'version' not in config or 'params' not in config:
            return False
        
        params = config['params']
        if not isinstance(params, dict):
            return False
        
        # 验证必需的参数
        required_params = ['cost_rate', 'expense_rate', 'tax_rate', 'months_per_year']
        for param in required_params:
            if param not in params:
                return False
        
        return True


class FormulaConfigManager:
    """
    公式配置管理器
    
    用于管理盈利测算公式的配置，支持配置的保存和加载
    """
    
    # 配置存储键（可以存储在数据库或缓存中）
    CONFIG_KEY = 'profit_calculation_formula_config'
    
    @classmethod
    def get_current_config(cls) -> Dict[str, Any]:
        """
        获取当前使用的公式配置
        
        Returns:
            公式配置字典
        """
        # TODO: 从数据库或缓存中加载配置
        # 目前返回默认配置
        return ProfitCalculationEngine.get_default_config()
    
    @classmethod
    def update_config(cls, config: Dict[str, Any]) -> bool:
        """
        更新公式配置
        
        Args:
            config: 新的公式配置
        
        Returns:
            更新是否成功
        """
        # 验证配置
        if not ProfitCalculationEngine.validate_config(config):
            return False
        
        # TODO: 保存配置到数据库或缓存
        # 目前只做验证
        return True
    
    @classmethod
    def reset_to_default(cls) -> Dict[str, Any]:
        """
        重置为默认配置
        
        Returns:
            默认配置字典
        """
        default_config = ProfitCalculationEngine.get_default_config()
        cls.update_config(default_config)
        return default_config
