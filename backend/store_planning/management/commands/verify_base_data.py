"""
验证开店计划管理模块的基础数据

该命令用于验证经营区域和门店类型数据的完整性和正确性。
"""

from django.core.management.base import BaseCommand
from store_planning.models import BusinessRegion, StoreType


class Command(BaseCommand):
    help = '验证开店计划管理模块的基础数据完整性'

    def handle(self, *args, **options):
        """执行验证逻辑"""
        self.stdout.write(self.style.HTTP_INFO('开始验证基础数据...'))
        
        # 验证经营区域
        self._verify_business_regions()
        
        # 验证门店类型
        self._verify_store_types()
        
        self.stdout.write(self.style.SUCCESS('基础数据验证完成！'))

    def _verify_business_regions(self):
        """验证经营区域数据"""
        self.stdout.write('\n=== 经营区域验证 ===')
        
        regions = BusinessRegion.objects.all().order_by('code')
        self.stdout.write(f'总数量: {regions.count()}')
        
        expected_regions = ['HD', 'HN', 'HB', 'HZ', 'XN', 'XB', 'DB']
        existing_codes = list(regions.values_list('code', flat=True))
        
        # 检查必需的区域是否存在
        missing_regions = set(expected_regions) - set(existing_codes)
        if missing_regions:
            self.stdout.write(
                self.style.WARNING(f'缺少经营区域: {", ".join(missing_regions)}')
            )
        else:
            self.stdout.write(self.style.SUCCESS('所有必需的经营区域都已存在'))
        
        # 显示所有区域
        for region in regions:
            status = '✓' if region.is_active else '✗'
            self.stdout.write(f'  {status} {region.name} ({region.code})')

    def _verify_store_types(self):
        """验证门店类型数据"""
        self.stdout.write('\n=== 门店类型验证 ===')
        
        store_types = StoreType.objects.all().order_by('code')
        self.stdout.write(f'总数量: {store_types.count()}')
        
        expected_types = ['ZY', 'JM', 'QJ', 'SQ', 'SC', 'WM', 'GN']
        existing_codes = list(store_types.values_list('code', flat=True))
        
        # 检查必需的门店类型是否存在
        missing_types = set(expected_types) - set(existing_codes)
        if missing_types:
            self.stdout.write(
                self.style.WARNING(f'缺少门店类型: {", ".join(missing_types)}')
            )
        else:
            self.stdout.write(self.style.SUCCESS('所有必需的门店类型都已存在'))
        
        # 显示所有门店类型
        for store_type in store_types:
            status = '✓' if store_type.is_active else '✗'
            self.stdout.write(f'  {status} {store_type.name} ({store_type.code})')