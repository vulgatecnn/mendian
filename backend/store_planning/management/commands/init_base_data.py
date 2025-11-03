"""
初始化开店计划管理模块的基础数据

该命令用于创建默认的经营区域和门店类型数据，支持系统的初始化部署。
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from store_planning.models import BusinessRegion, StoreType


class Command(BaseCommand):
    help = '初始化开店计划管理模块的基础数据（经营区域和门店类型）'

    def add_arguments(self, parser):
        """添加命令行参数"""
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新创建数据（会删除现有数据）',
        )
        parser.add_argument(
            '--regions-only',
            action='store_true',
            help='仅初始化经营区域数据',
        )
        parser.add_argument(
            '--store-types-only',
            action='store_true',
            help='仅初始化门店类型数据',
        )

    def handle(self, *args, **options):
        """执行命令的主要逻辑"""
        try:
            with transaction.atomic():
                if options['force']:
                    self._clear_existing_data(options)
                
                if not options['store_types_only']:
                    self._create_business_regions()
                
                if not options['regions_only']:
                    self._create_store_types()
                
                self.stdout.write(
                    self.style.SUCCESS('基础数据初始化完成！')
                )
                
        except Exception as e:
            raise CommandError(f'初始化基础数据时发生错误: {str(e)}')

    def _clear_existing_data(self, options):
        """清除现有数据"""
        if not options['store_types_only']:
            region_count = BusinessRegion.objects.count()
            if region_count > 0:
                try:
                    BusinessRegion.objects.all().delete()
                    self.stdout.write(
                        self.style.WARNING(f'已删除 {region_count} 个现有经营区域')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'无法删除经营区域数据，可能存在关联数据: {str(e)}')
                    )
                    self.stdout.write(
                        self.style.WARNING('将跳过经营区域的删除，仅更新现有数据')
                    )
        
        if not options['regions_only']:
            store_type_count = StoreType.objects.count()
            if store_type_count > 0:
                try:
                    StoreType.objects.all().delete()
                    self.stdout.write(
                        self.style.WARNING(f'已删除 {store_type_count} 个现有门店类型')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'无法删除门店类型数据，可能存在关联数据: {str(e)}')
                    )
                    self.stdout.write(
                        self.style.WARNING('将跳过门店类型的删除，仅更新现有数据')
                    )

    def _create_business_regions(self):
        """创建默认的经营区域数据"""
        regions_data = [
            {
                'name': '华东区',
                'code': 'HD',
                'description': '包括上海、江苏、浙江、安徽、福建、江西、山东等省市',
                'is_active': True
            },
            {
                'name': '华南区',
                'code': 'HN',
                'description': '包括广东、广西、海南等省区',
                'is_active': True
            },
            {
                'name': '华北区',
                'code': 'HB',
                'description': '包括北京、天津、河北、山西、内蒙古等省市区',
                'is_active': True
            },
            {
                'name': '华中区',
                'code': 'HZ',
                'description': '包括河南、湖北、湖南等省份',
                'is_active': True
            },
            {
                'name': '西南区',
                'code': 'XN',
                'description': '包括重庆、四川、贵州、云南、西藏等省市区',
                'is_active': True
            },
            {
                'name': '西北区',
                'code': 'XB',
                'description': '包括陕西、甘肃、青海、宁夏、新疆等省区',
                'is_active': True
            },
            {
                'name': '东北区',
                'code': 'DB',
                'description': '包括辽宁、吉林、黑龙江等省份',
                'is_active': True
            },
        ]

        created_count = 0
        updated_count = 0
        for region_data in regions_data:
            region, created = BusinessRegion.objects.get_or_create(
                code=region_data['code'],
                defaults=region_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'创建经营区域: {region.name} ({region.code})')
            else:
                # 更新现有数据以确保一致性
                updated = False
                if region.name != region_data['name']:
                    region.name = region_data['name']
                    updated = True
                if region.description != region_data['description']:
                    region.description = region_data['description']
                    updated = True
                if not region.is_active:
                    region.is_active = True
                    updated = True
                
                if updated:
                    region.save()
                    updated_count += 1
                    self.stdout.write(f'更新经营区域: {region.name} ({region.code})')
                else:
                    self.stdout.write(f'经营区域已存在: {region.name} ({region.code})')

        self.stdout.write(
            self.style.SUCCESS(f'经营区域初始化完成，新创建 {created_count} 个区域，更新 {updated_count} 个区域')
        )

    def _create_store_types(self):
        """创建默认的门店类型数据"""
        store_types_data = [
            {
                'name': '直营店',
                'code': 'ZY',
                'description': '公司直接经营管理的门店',
                'is_active': True
            },
            {
                'name': '加盟店',
                'code': 'JM',
                'description': '加盟商经营的门店',
                'is_active': True
            },
            {
                'name': '旗舰店',
                'code': 'QJ',
                'description': '品牌形象店，通常位于核心商圈',
                'is_active': True
            },
            {
                'name': '社区店',
                'code': 'SQ',
                'description': '位于居民社区的便民门店',
                'is_active': True
            },
            {
                'name': '商场店',
                'code': 'SC',
                'description': '位于购物中心或商场内的门店',
                'is_active': True
            },
            {
                'name': '外卖店',
                'code': 'WM',
                'description': '主要提供外卖服务的门店',
                'is_active': True
            },
            {
                'name': '概念店',
                'code': 'GN',
                'description': '试验新概念、新产品的门店',
                'is_active': True
            },
        ]

        created_count = 0
        updated_count = 0
        for store_type_data in store_types_data:
            store_type, created = StoreType.objects.get_or_create(
                code=store_type_data['code'],
                defaults=store_type_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'创建门店类型: {store_type.name} ({store_type.code})')
            else:
                # 更新现有数据以确保一致性
                updated = False
                if store_type.name != store_type_data['name']:
                    store_type.name = store_type_data['name']
                    updated = True
                if store_type.description != store_type_data['description']:
                    store_type.description = store_type_data['description']
                    updated = True
                if not store_type.is_active:
                    store_type.is_active = True
                    updated = True
                
                if updated:
                    store_type.save()
                    updated_count += 1
                    self.stdout.write(f'更新门店类型: {store_type.name} ({store_type.code})')
                else:
                    self.stdout.write(f'门店类型已存在: {store_type.name} ({store_type.code})')

        self.stdout.write(
            self.style.SUCCESS(f'门店类型初始化完成，新创建 {created_count} 个类型，更新 {updated_count} 个类型')
        )