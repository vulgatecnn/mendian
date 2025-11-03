"""
开店计划导入导出功能测试
"""
import io
import pandas as pd
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import BusinessRegion, StoreType, StorePlan
from .import_export_service import PlanImportExportService

User = get_user_model()


class PlanImportExportServiceTest(TestCase):
    """计划导入导出服务测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 创建测试区域
        self.region = BusinessRegion.objects.create(
            name='华东区',
            code='HD',
            description='华东区域',
            is_active=True
        )
        
        # 创建测试门店类型
        self.store_type = StoreType.objects.create(
            name='直营店',
            code='ZY',
            description='直营门店',
            is_active=True
        )
        
        # 初始化服务
        self.service = PlanImportExportService()
    
    def test_generate_import_template(self):
        """测试生成导入模板"""
        template_content = self.service.generate_import_template()
        
        # 验证模板内容不为空
        self.assertIsNotNone(template_content)
        self.assertGreater(len(template_content), 0)
        
        # 验证可以读取为Excel文件
        df = pd.read_excel(io.BytesIO(template_content))
        
        # 验证包含必要的列
        expected_columns = [
            '计划名称', '计划类型', '开始日期', '结束日期', '计划描述',
            '经营区域', '区域编码', '门店类型', '类型编码',
            '目标数量', '贡献率(%)', '预算金额'
        ]
        
        for col in expected_columns:
            self.assertIn(col, df.columns)
    
    def test_generate_advanced_template(self):
        """测试生成高级模板"""
        # 测试标准模板
        template_content = self.service.generate_advanced_import_template(
            include_sample_data=True,
            template_type='standard'
        )
        self.assertIsNotNone(template_content)
        
        # 测试空白模板
        empty_template = self.service.generate_advanced_import_template(
            include_sample_data=False,
            template_type='empty'
        )
        self.assertIsNotNone(empty_template)
    
    def test_validate_excel_structure(self):
        """测试Excel结构验证"""
        # 创建正确结构的DataFrame
        correct_data = pd.DataFrame({
            '计划名称': ['测试计划'],
            '计划类型': ['年度计划'],
            '开始日期': ['2024-01-01'],
            '结束日期': ['2024-12-31'],
            '计划描述': ['测试描述'],
            '经营区域': ['华东区'],
            '区域编码': ['HD'],
            '门店类型': ['直营店'],
            '类型编码': ['ZY'],
            '目标数量': [50],
            '贡献率(%)': [30.5],
            '预算金额': [5000000]
        })
        
        # 验证正确结构
        self.assertTrue(self.service.validate_excel_structure(correct_data))
        
        # 创建错误结构的DataFrame（缺少必要列）
        incorrect_data = pd.DataFrame({
            '计划名称': ['测试计划'],
            '计划类型': ['年度计划']
        })
        
        # 验证错误结构
        self.assertFalse(self.service.validate_excel_structure(incorrect_data))
    
    def test_clean_and_validate_row_data(self):
        """测试行数据清理和验证"""
        # 创建有效的行数据
        valid_row = pd.Series({
            '计划名称': '测试计划',
            '计划类型': '年度计划',
            '开始日期': '2024-01-01',
            '结束日期': '2024-12-31',
            '计划描述': '测试描述',
            '经营区域': '华东区',
            '区域编码': 'HD',
            '门店类型': '直营店',
            '类型编码': 'ZY',
            '目标数量': 50,
            '贡献率(%)': 30.5,
            '预算金额': 5000000
        })
        
        # 清理错误列表
        self.service.errors = []
        
        # 验证有效数据
        cleaned_data = self.service.clean_and_validate_row_data(valid_row, 0)
        self.assertIsNotNone(cleaned_data)
        self.assertEqual(cleaned_data['plan_name'], '测试计划')
        self.assertEqual(cleaned_data['plan_type'], 'annual')
        self.assertEqual(cleaned_data['target_count'], 50)
        
        # 创建无效的行数据（缺少必填字段）
        invalid_row = pd.Series({
            '计划名称': '',  # 空值
            '计划类型': '年度计划',
            '开始日期': '2024-01-01',
            '结束日期': '2024-12-31',
            '计划描述': '',
            '经营区域': '华东区',
            '区域编码': 'HD',
            '门店类型': '直营店',
            '类型编码': 'ZY',
            '目标数量': 50,
            '贡献率(%)': 30.5,
            '预算金额': 5000000
        })
        
        # 清理错误列表
        self.service.errors = []
        
        # 验证无效数据
        cleaned_data = self.service.clean_and_validate_row_data(invalid_row, 0)
        self.assertIsNone(cleaned_data)
        self.assertGreater(len(self.service.errors), 0)
    
    def test_get_template_types(self):
        """测试获取模板类型"""
        template_types = self.service.get_template_types()
        
        # 验证返回的模板类型
        self.assertIsInstance(template_types, list)
        self.assertGreater(len(template_types), 0)
        
        # 验证每个模板类型包含必要字段
        for template_type in template_types:
            self.assertIn('type', template_type)
            self.assertIn('name', template_type)
            self.assertIn('description', template_type)
            self.assertIn('sample_count', template_type)
    
    def test_export_plans_to_excel(self):
        """测试导出计划到Excel"""
        # 创建测试计划
        plan = StorePlan.objects.create(
            name='测试计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            description='测试计划描述',
            created_by=self.user
        )
        
        # 创建区域计划
        from .models import RegionalPlan
        RegionalPlan.objects.create(
            plan=plan,
            region=self.region,
            store_type=self.store_type,
            target_count=50,
            contribution_rate=Decimal('30.5'),
            budget_amount=Decimal('5000000')
        )
        
        # 导出Excel
        excel_content = self.service.export_plans_to_excel(plan_ids=[plan.id])
        
        # 验证导出内容
        self.assertIsNotNone(excel_content)
        self.assertGreater(len(excel_content), 0)
        
        # 验证可以读取为Excel文件
        df = pd.read_excel(io.BytesIO(excel_content))
        self.assertGreater(len(df), 0)
        
        # 验证包含计划数据
        self.assertEqual(df.iloc[0]['计划名称'], '测试计划')
        self.assertEqual(df.iloc[0]['经营区域'], '华东区')
        self.assertEqual(df.iloc[0]['门店类型'], '直营店')
    
    def test_get_export_statistics(self):
        """测试获取导出统计信息"""
        # 创建测试计划
        plan = StorePlan.objects.create(
            name='测试计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            description='测试计划描述',
            created_by=self.user
        )
        
        # 获取统计信息
        statistics = self.service.get_export_statistics(plan_ids=[plan.id])
        
        # 验证统计信息
        self.assertIsInstance(statistics, dict)
        self.assertIn('total_plans', statistics)
        self.assertIn('total_regional_plans', statistics)
        self.assertIn('status_distribution', statistics)
        self.assertIn('type_distribution', statistics)
        self.assertEqual(statistics['total_plans'], 1)