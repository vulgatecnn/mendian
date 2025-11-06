"""
生成测试数据的管理命令
用于快速填充系统测试数据
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import random

from system_management.models import User, Department, Role
from base_data.models import BusinessRegion, LegalEntity, Supplier, Customer, Budget
from store_planning.models import StorePlan, StoreType
from store_expansion.models import CandidateLocation, FollowUpRecord
from store_preparation.models import ConstructionProject
from store_archive.models import StoreArchive


class Command(BaseCommand):
    help = '生成测试数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清除现有测试数据',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('清除现有测试数据...')
            self.clear_test_data()
            self.stdout.write(self.style.SUCCESS('✓ 测试数据已清除'))
            return

        self.stdout.write('开始生成测试数据...')
        
        try:
            with transaction.atomic():
                # 1. 创建部门和用户
                self.stdout.write('1. 创建部门和用户...')
                departments = self.create_departments()
                users = self.create_users(departments)
                
                # 2. 创建基础数据
                self.stdout.write('2. 创建基础数据...')
                regions = self.create_regions()
                legal_entities = self.create_legal_entities()
                suppliers = self.create_suppliers()
                customers = self.create_customers()
                budgets = self.create_budgets(regions)
                
                # 3. 创建门店类型
                self.stdout.write('3. 创建门店类型...')
                store_types = self.create_store_types()
                
                # 4. 创建开店计划
                self.stdout.write('4. 创建开店计划...')
                plans = self.create_store_plans(regions, store_types, users)
                
                # 5. 创建候选位置
                self.stdout.write('5. 创建候选位置...')
                locations = self.create_candidate_locations(regions, users)
                
                # 6. 创建跟进记录
                self.stdout.write('6. 创建跟进记录...')
                self.create_follow_up_records(locations, users)
                
                # 7. 创建施工项目
                self.stdout.write('7. 创建施工项目...')
                projects = self.create_construction_projects(locations, suppliers, users)
                
                # 8. 创建门店档案
                self.stdout.write('8. 创建门店档案...')
                self.create_store_archives(regions, store_types, legal_entities, customers)
                
            self.stdout.write(self.style.SUCCESS('\n✓ 测试数据生成完成！'))
            self.print_summary()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ 生成失败: {str(e)}'))
            raise

    def clear_test_data(self):
        """清除测试数据"""
        StoreArchive.objects.all().delete()
        ConstructionProject.objects.all().delete()
        FollowUpRecord.objects.all().delete()
        CandidateLocation.objects.all().delete()
        StorePlan.objects.all().delete()
        StoreType.objects.all().delete()
        Budget.objects.all().delete()
        Customer.objects.all().delete()
        Supplier.objects.all().delete()
        LegalEntity.objects.all().delete()
        BusinessRegion.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        Department.objects.all().delete()

    def create_departments(self):
        """创建部门"""
        departments = []
        dept_data = [
            {'name': '总裁办', 'code': 'CEO', 'parent': None},
            {'name': '运营中心', 'code': 'OPS', 'parent': None},
            {'name': '拓展部', 'code': 'EXP', 'parent': 'OPS'},
            {'name': '工程部', 'code': 'ENG', 'parent': 'OPS'},
            {'name': '财务部', 'code': 'FIN', 'parent': None},
            {'name': '人力资源部', 'code': 'HR', 'parent': None},
        ]
        
        dept_map = {}
        for data in dept_data:
            parent = dept_map.get(data['parent']) if data['parent'] else None
            dept = Department.objects.create(
                name=data['name'],
                code=data['code'],
                parent=parent,
                description=f'{data["name"]}负责相关业务'
            )
            dept_map[data['code']] = dept
            departments.append(dept)
        
        return departments

    def create_users(self, departments):
        """创建用户"""
        users = []
        user_data = [
            {'username': 'ceo', 'name': '张总', 'dept': '总裁办', 'role': '总经理'},
            {'username': 'ops_manager', 'name': '李经理', 'dept': '运营中心', 'role': '运营经理'},
            {'username': 'exp_manager', 'name': '王经理', 'dept': '拓展部', 'role': '拓展经理'},
            {'username': 'exp_staff1', 'name': '赵拓展', 'dept': '拓展部', 'role': '拓展专员'},
            {'username': 'exp_staff2', 'name': '钱拓展', 'dept': '拓展部', 'role': '拓展专员'},
            {'username': 'eng_manager', 'name': '孙经理', 'dept': '工程部', 'role': '工程经理'},
            {'username': 'eng_staff1', 'name': '周工程', 'dept': '工程部', 'role': '工程师'},
            {'username': 'fin_manager', 'name': '吴经理', 'dept': '财务部', 'role': '财务经理'},
        ]
        
        dept_map = {d.name: d for d in departments}
        
        for data in user_data:
            user = User.objects.create_user(
                username=data['username'],
                password='test123',
                first_name=data['name'],
                phone=f'138{random.randint(10000000, 99999999)}',
                department=dept_map.get(data['dept']),
                position=data['role'],
                wechat_user_id=f'wechat_{data["username"]}'
            )
            users.append(user)
        
        return users

    def create_regions(self):
        """创建经营区域"""
        regions = []
        region_data = [
            {'name': '华东区', 'code': 'HD', 'provinces': ['上海', '江苏', '浙江']},
            {'name': '华南区', 'code': 'HN', 'provinces': ['广东', '福建', '海南']},
            {'name': '华北区', 'code': 'HB', 'provinces': ['北京', '天津', '河北']},
            {'name': '西南区', 'code': 'XN', 'provinces': ['四川', '重庆', '云南']},
        ]
        
        for data in region_data:
            region = BusinessRegion.objects.create(
                name=data['name'],
                code=data['code'],
                description=f'{data["name"]}包含{", ".join(data["provinces"])}'
            )
            regions.append(region)
        
        return regions

    def create_legal_entities(self):
        """创建法人主体"""
        entities = []
        entity_names = ['好饭碗餐饮管理有限公司', '好饭碗（上海）餐饮有限公司', '好饭碗（广州）餐饮有限公司']
        
        for name in entity_names:
            entity = LegalEntity.objects.create(
                name=name,
                code=f'LE{random.randint(1000, 9999)}',
                tax_number=f'{random.randint(100000000000000, 999999999999999)}',
                legal_representative='张三',
                contact_phone='021-12345678'
            )
            entities.append(entity)
        
        return entities

    def create_suppliers(self):
        """创建供应商"""
        suppliers = []
        supplier_names = ['XX装修公司', 'YY设备供应商', 'ZZ家具厂', 'AA电器商行']
        
        for name in supplier_names:
            supplier = Supplier.objects.create(
                name=name,
                code=f'SUP{random.randint(1000, 9999)}',
                contact_person='李四',
                contact_phone=f'138{random.randint(10000000, 99999999)}',
                supplier_type=random.choice(['decoration', 'equipment', 'material'])
            )
            suppliers.append(supplier)
        
        return suppliers

    def create_customers(self):
        """创建客户/加盟商"""
        customers = []
        customer_names = ['张加盟', '李加盟', '王加盟', '赵加盟']
        
        for name in customer_names:
            customer = Customer.objects.create(
                name=name,
                code=f'CUS{random.randint(1000, 9999)}',
                contact_phone=f'138{random.randint(10000000, 99999999)}',
                customer_type=random.choice(['direct', 'franchise']),
                credit_level=random.choice(['A', 'B', 'C'])
            )
            customers.append(customer)
        
        return customers

    def create_budgets(self, regions):
        """创建经营预算"""
        budgets = []
        current_year = timezone.now().year
        
        for region in regions:
            for quarter in range(1, 5):
                budget = Budget.objects.create(
                    year=current_year,
                    quarter=quarter,
                    region=region,
                    total_budget=random.randint(5000000, 10000000),
                    store_count_target=random.randint(10, 30)
                )
                budgets.append(budget)
        
        return budgets

    def create_store_types(self):
        """创建门店类型"""
        types = []
        type_data = [
            {'name': '标准店', 'code': 'STD', 'area': 150, 'investment': 500000},
            {'name': '旗舰店', 'code': 'FLG', 'area': 300, 'investment': 1000000},
            {'name': '社区店', 'code': 'COM', 'area': 80, 'investment': 300000},
        ]
        
        for data in type_data:
            store_type = StoreType.objects.create(
                name=data['name'],
                code=data['code'],
                min_area=data['area'] - 20,
                max_area=data['area'] + 50,
                estimated_investment=data['investment'],
                description=f'{data["name"]}标准配置'
            )
            types.append(store_type)
        
        return types

    def create_store_plans(self, regions, store_types, users):
        """创建开店计划"""
        plans = []
        current_year = timezone.now().year
        
        for region in regions[:2]:  # 只为前两个区域创建计划
            for quarter in range(1, 5):
                for store_type in store_types[:2]:  # 只创建标准店和旗舰店计划
                    plan = StorePlan.objects.create(
                        year=current_year,
                        quarter=quarter,
                        region=region,
                        store_type=store_type,
                        planned_count=random.randint(3, 8),
                        target_revenue=random.randint(1000000, 3000000),
                        status=random.choice(['draft', 'submitted', 'approved']),
                        created_by=random.choice(users)
                    )
                    plans.append(plan)
        
        return plans

    def create_candidate_locations(self, regions, users):
        """创建候选位置"""
        locations = []
        cities = {
            regions[0]: ['上海', '杭州', '南京'],
            regions[1]: ['广州', '深圳', '厦门'],
        }
        
        for region in regions[:2]:
            for city in cities.get(region, []):
                for i in range(random.randint(3, 6)):
                    location = CandidateLocation.objects.create(
                        name=f'{city}{random.choice(["万达", "大悦城", "龙湖", "印象城"])}店',
                        region=region,
                        province=city if city in ['上海', '北京'] else '广东',
                        city=city,
                        district=f'{random.choice(["A", "B", "C", "D"])}区',
                        address=f'{random.choice(["中山路", "人民路", "解放路"])}{random.randint(100, 999)}号',
                        area=random.randint(100, 300),
                        rent_price=random.randint(50000, 150000),
                        status=random.choice(['pending', 'following', 'signed', 'rejected']),
                        source=random.choice(['self', 'agent', 'recommendation']),
                        created_by=random.choice(users)
                    )
                    locations.append(location)
        
        return locations

    def create_follow_up_records(self, locations, users):
        """创建跟进记录"""
        records = []
        
        for location in locations[:20]:  # 为前20个位置创建跟进记录
            for i in range(random.randint(1, 4)):
                record = FollowUpRecord.objects.create(
                    location=location,
                    follow_up_date=timezone.now() - timedelta(days=random.randint(1, 30)),
                    follow_up_type=random.choice(['site_visit', 'negotiation', 'contract']),
                    content=f'第{i+1}次跟进，{random.choice(["洽谈顺利", "需要进一步沟通", "等待对方回复"])}',
                    next_follow_up_date=timezone.now() + timedelta(days=random.randint(3, 10)),
                    created_by=random.choice(users)
                )
                records.append(record)
        
        return records

    def create_construction_projects(self, locations, suppliers, users):
        """创建施工项目"""
        projects = []
        signed_locations = [loc for loc in locations if loc.status == 'signed']
        
        for location in signed_locations[:10]:  # 为前10个已签约位置创建施工项目
            project = ConstructionProject.objects.create(
                name=f'{location.name}装修工程',
                location=location,
                supplier=random.choice(suppliers),
                contract_amount=random.randint(300000, 800000),
                start_date=timezone.now() - timedelta(days=random.randint(30, 60)),
                planned_end_date=timezone.now() + timedelta(days=random.randint(30, 90)),
                status=random.choice(['planning', 'in_progress', 'completed']),
                progress=random.randint(20, 80),
                created_by=random.choice(users)
            )
            projects.append(project)
        
        return projects

    def create_store_archives(self, regions, store_types, legal_entities, customers):
        """创建门店档案"""
        archives = []
        cities = ['上海', '杭州', '广州', '深圳', '北京']
        
        for i in range(20):
            city = random.choice(cities)
            archive = StoreArchive.objects.create(
                store_code=f'ST{timezone.now().year}{str(i+1).zfill(4)}',
                store_name=f'{city}{random.choice(["万达", "大悦城", "龙湖"])}店',
                region=random.choice(regions),
                store_type=random.choice(store_types),
                legal_entity=random.choice(legal_entities),
                operation_mode=random.choice(['direct', 'franchise']),
                franchisee=random.choice(customers) if random.random() > 0.5 else None,
                province=city if city in ['上海', '北京'] else '广东',
                city=city,
                district=f'{random.choice(["A", "B", "C"])}区',
                address=f'{random.choice(["中山路", "人民路"])}{random.randint(100, 999)}号',
                area=random.randint(100, 300),
                opening_date=timezone.now() - timedelta(days=random.randint(30, 365)),
                status=random.choice(['operating', 'preparing', 'closed'])
            )
            archives.append(archive)
        
        return archives

    def print_summary(self):
        """打印数据统计"""
        self.stdout.write('\n数据统计：')
        self.stdout.write(f'  部门: {Department.objects.count()}')
        self.stdout.write(f'  用户: {User.objects.count()}')
        self.stdout.write(f'  经营区域: {BusinessRegion.objects.count()}')
        self.stdout.write(f'  法人主体: {LegalEntity.objects.count()}')
        self.stdout.write(f'  供应商: {Supplier.objects.count()}')
        self.stdout.write(f'  客户: {Customer.objects.count()}')
        self.stdout.write(f'  经营预算: {Budget.objects.count()}')
        self.stdout.write(f'  门店类型: {StoreType.objects.count()}')
        self.stdout.write(f'  开店计划: {StorePlan.objects.count()}')
        self.stdout.write(f'  候选位置: {CandidateLocation.objects.count()}')
        self.stdout.write(f'  跟进记录: {FollowUpRecord.objects.count()}')
        self.stdout.write(f'  施工项目: {ConstructionProject.objects.count()}')
        self.stdout.write(f'  门店档案: {StoreArchive.objects.count()}')
