import { PrismaClient, UserRoleType, SupplierCategory, StoreType, Priority } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedRoles() {
  console.log('Seeding roles...');
  
  const roles = [
    {
      name: '总裁办人员',
      code: 'PRESIDENT_OFFICE',
      type: UserRoleType.PRESIDENT_OFFICE,
      description: '经营大屏、数据报表查看',
      isSystem: true,
      sortOrder: 1,
    },
    {
      name: '商务人员', 
      code: 'BUSINESS_STAFF',
      type: UserRoleType.BUSINESS_STAFF,
      description: '开店计划、拓店、筹备、审批全流程',
      isSystem: true,
      sortOrder: 2,
    },
    {
      name: '运营人员',
      code: 'OPERATIONS_STAFF',
      type: UserRoleType.OPERATIONS_STAFF, 
      description: '计划管理、候选点位、拓店跟进',
      isSystem: true,
      sortOrder: 3,
    },
    {
      name: '销售人员',
      code: 'SALES_STAFF',
      type: UserRoleType.SALES_STAFF,
      description: '跟进管理、交付管理、门店档案',
      isSystem: true,
      sortOrder: 4,
    },
    {
      name: '财务人员',
      code: 'FINANCE_STAFF',
      type: UserRoleType.FINANCE_STAFF,
      description: '跟进审批参与',
      isSystem: true,
      sortOrder: 5,
    },
    {
      name: '加盟商',
      code: 'FRANCHISEE',
      type: UserRoleType.FRANCHISEE,
      description: '交付确认、门店档案查看',
      isSystem: true,
      sortOrder: 6,
    },
    {
      name: '店长',
      code: 'STORE_MANAGER',
      type: UserRoleType.STORE_MANAGER,
      description: '交付确认、门店档案查看',
      isSystem: true,
      sortOrder: 7,
    },
    {
      name: '系统管理员',
      code: 'ADMIN',
      type: UserRoleType.ADMIN,
      description: '基础数据、系统管理、审批模板配置',
      isSystem: true,
      sortOrder: 8,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }
}

async function seedPermissions() {
  console.log('Seeding permissions...');
  
  const modules = [
    'store-plan',
    'expansion', 
    'preparation',
    'store-files',
    'operation',
    'approval',
    'basic-data',
    'system',
  ];

  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export'];

  const permissions = [];
  
  for (const module of modules) {
    for (const action of actions) {
      permissions.push({
        name: `${module}:${action}`,
        code: `${module.toUpperCase()}_${action.toUpperCase()}`,
        module,
        action,
        description: `${action} permission for ${module} module`,
        isSystem: true,
      });
    }
  }

  // Add special permissions
  permissions.push(
    {
      name: 'dashboard:view',
      code: 'DASHBOARD_VIEW',
      module: 'dashboard',
      action: 'view',
      description: 'View dashboard and reports',
      isSystem: true,
    },
    {
      name: 'wechat:sync',
      code: 'WECHAT_SYNC',
      module: 'system',
      action: 'sync',
      description: 'Sync WeChat Work data',
      isSystem: true,
    },
  );

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }
}

async function seedRegions() {
  console.log('Seeding regions...');
  
  // 创建几个示例省份和城市
  const provinces = [
    { name: '广东省', code: 'GD' },
    { name: '江苏省', code: 'JS' },
    { name: '浙江省', code: 'ZJ' },
    { name: '上海市', code: 'SH' },
    { name: '北京市', code: 'BJ' },
  ];

  for (const province of provinces) {
    const provinceRecord = await prisma.region.upsert({
      where: { code: province.code },
      update: { 
        name: province.name,
        code: province.code,
        fullPath: province.name 
      },
      create: { ...province, level: 1, fullPath: province.name, sortOrder: 1 },
    });

    // 为每个省份创建几个城市
    const cities = [
      `${province.name.replace('省', '').replace('市', '')}市区1`,
      `${province.name.replace('省', '').replace('市', '')}市区2`,
      `${province.name.replace('省', '').replace('市', '')}市区3`,
    ];

    for (let i = 0; i < cities.length; i++) {
      await prisma.region.upsert({
        where: { code: `${province.code}_${i + 1}` },
        update: {
          name: cities[i] || `${province.name.replace('省', '').replace('市', '')}市区${i + 1}`,
          code: `${province.code}_${i + 1}`,
          fullPath: `${province.name}/${cities[i] || `${province.name.replace('省', '').replace('市', '')}市区${i + 1}`}`,
        },
        create: {
          name: cities[i] || `${province.name.replace('省', '').replace('市', '')}市区${i + 1}`,
          code: `${province.code}_${i + 1}`,
          parentId: provinceRecord.id,
          level: 2,
          fullPath: `${province.name}/${cities[i] || `${province.name.replace('省', '').replace('市', '')}市区${i + 1}`}`,
          sortOrder: i + 1,
        },
      });
    }
  }
}

async function seedCompanyEntities() {
  console.log('Seeding company entities...');
  
  const entities = [
    {
      name: '好饭碗餐饮管理有限公司',
      code: 'HFW_MAIN',
      legalName: '北京好饭碗餐饮管理有限公司',
      taxId: '91110101MA01234567',
      address: '北京市朝阳区建国路88号',
      contactName: '张经理',
      contactPhone: '010-12345678',
      contactEmail: 'zhang@haofanwan.com',
      legalPerson: '张三',
      registeredCapital: new Decimal(1000000),
      establishedDate: new Date('2020-01-15'),
      businessScope: '餐饮管理服务；食品销售；餐厅服务',
    },
    {
      name: '好饭碗上海分公司',
      code: 'HFW_SH',
      legalName: '好饭碗餐饮管理（上海）有限公司',
      taxId: '91310101MA01234568',
      address: '上海市黄浦区南京路100号',
      contactName: '李经理',
      contactPhone: '021-12345678',
      contactEmail: 'li@haofanwan.com',
      legalPerson: '李四',
      registeredCapital: new Decimal(500000),
      establishedDate: new Date('2021-03-20'),
      businessScope: '餐饮管理服务；食品销售',
    },
  ];

  for (const entity of entities) {
    await prisma.companyEntity.upsert({
      where: { code: entity.code },
      update: entity,
      create: entity,
    });
  }
}

async function seedSuppliers() {
  console.log('Seeding suppliers...');
  
  const suppliers = [
    {
      name: '鼎盛装修工程有限公司',
      code: 'DS_DECORATION',
      category: SupplierCategory.CONSTRUCTION,
      contactName: '王工',
      contactPhone: '138-0000-1111',
      contactEmail: 'wang@dingsheng.com',
      address: '北京市海淀区中关村大街123号',
      taxId: '91110108MA01234569',
      bankAccount: '123456789012345678',
      bankName: '中国建设银行北京分行',
      creditRating: 'AA',
    },
    {
      name: '华美厨房设备有限公司',
      code: 'HM_KITCHEN',
      category: SupplierCategory.EQUIPMENT,
      contactName: '刘经理',
      contactPhone: '138-0000-2222',
      contactEmail: 'liu@huamei.com',
      address: '上海市浦东新区张江路456号',
      taxId: '91310115MA01234570',
      bankAccount: '987654321098765432',
      bankName: '中国工商银行上海分行',
      creditRating: 'A',
    },
    {
      name: '锦绣装饰设计有限公司',
      code: 'JX_DECORATION',
      category: SupplierCategory.DECORATION,
      contactName: '张设计师',
      contactPhone: '138-0000-3333',
      contactEmail: 'zhang@jinxiu.com',
      address: '深圳市南山区科技园路789号',
      taxId: '91440300MA01234571',
      bankAccount: '456789123456789123',
      bankName: '平安银行深圳分行',
      creditRating: 'A',
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: supplier,
      create: supplier,
    });
  }
}

async function seedApprovalTemplates() {
  console.log('Seeding approval templates...');
  
  const templates = [
    {
      name: '报店审批',
      code: 'STORE_REPORT',
      category: '开店计划',
      description: '新店开店计划申报审批流程',
      steps: [
        { step: 1, name: '部门主管审批', roles: ['OPERATIONS_STAFF'], required: true },
        { step: 2, name: '商务总监审批', roles: ['BUSINESS_STAFF'], required: true },
        { step: 3, name: '总裁办审批', roles: ['PRESIDENT_OFFICE'], required: true },
      ],
      isSystem: true,
    },
    {
      name: '执照审批',
      code: 'LICENSE_APPROVAL',
      category: '门店筹备',
      description: '门店营业执照办理审批流程',
      steps: [
        { step: 1, name: '法务审核', roles: ['BUSINESS_STAFF'], required: true },
        { step: 2, name: '财务审核', roles: ['FINANCE_STAFF'], required: true },
        { step: 3, name: '总经理审批', roles: ['PRESIDENT_OFFICE'], required: true },
      ],
      isSystem: true,
    },
    {
      name: '比价审批',
      code: 'PRICE_COMPARISON',
      category: '供应商管理',
      description: '供应商比价采购审批流程',
      steps: [
        { step: 1, name: '采购主管审核', roles: ['BUSINESS_STAFF'], required: true },
        { step: 2, name: '财务审核', roles: ['FINANCE_STAFF'], required: true },
        { step: 3, name: '总经理审批', roles: ['PRESIDENT_OFFICE'], required: true },
      ],
      isSystem: true,
    },
  ];

  for (const template of templates) {
    await prisma.approvalTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        category: template.category,
        description: template.description,
        steps: template.steps,
      },
      create: {
        name: template.name,
        code: template.code,
        category: template.category,
        description: template.description,
        steps: template.steps,
      },
    });
  }
}

// 创建示例部门数据
async function seedDepartments() {
  console.log('Seeding departments...');
  
  const departments = [
    {
      wechatId: 'dept_root',
      name: '好饭碗总部',
      level: 1,
      fullPath: '好饭碗总部',
      sortOrder: 1,
    },
    {
      wechatId: 'dept_business',
      name: '商务部',
      level: 2,
      fullPath: '好饭碗总部/商务部',
      sortOrder: 1,
    },
    {
      wechatId: 'dept_operations',
      name: '运营部',
      level: 2,
      fullPath: '好饭碗总部/运营部',
      sortOrder: 2,
    },
    {
      wechatId: 'dept_finance',
      name: '财务部',
      level: 2,
      fullPath: '好饭碗总部/财务部',
      sortOrder: 3,
    },
    {
      wechatId: 'dept_president',
      name: '总裁办',
      level: 2,
      fullPath: '好饭碗总部/总裁办',
      sortOrder: 4,
    },
  ];

  let parentDept = null;
  
  for (const dept of departments) {
    const deptRecord: any = await prisma.department.upsert({
      where: { wechatId: dept.wechatId },
      update: dept,
      create: {
        ...dept,
        parentId: dept.level === 1 ? null : parentDept?.id,
      },
    });
    
    if (dept.level === 1) {
      parentDept = deptRecord;
    }
  }
}

// 创建示例用户数据
async function seedUsers() {
  console.log('Seeding users...');
  
  // 获取部门信息
  const departments = await prisma.department.findMany();
  const businessDept = departments.find(d => d.wechatId === 'dept_business');
  const operationsDept = departments.find(d => d.wechatId === 'dept_operations');
  const financeDept = departments.find(d => d.wechatId === 'dept_finance');
  const presidentDept = departments.find(d => d.wechatId === 'dept_president');

  const users = [
    {
      wechatId: 'wechat_admin',
      username: 'admin',
      email: 'admin@haofanwan.com',
      name: '系统管理员',
      phone: '13800138000',
      employeeId: 'EMP001',
      departmentId: presidentDept?.id || null,
    },
    {
      wechatId: 'wechat_business01',
      username: 'business01',
      email: 'business01@haofanwan.com',
      name: '商务经理',
      phone: '13800138001',
      employeeId: 'EMP002',
      departmentId: businessDept?.id || null,
    },
    {
      wechatId: 'wechat_ops01',
      username: 'operations01',
      email: 'ops01@haofanwan.com',
      name: '运营主管',
      phone: '13800138002',
      employeeId: 'EMP003',
      departmentId: operationsDept?.id || null,
    },
    {
      wechatId: 'wechat_finance01',
      username: 'finance01',
      email: 'finance01@haofanwan.com',
      name: '财务专员',
      phone: '13800138003',
      employeeId: 'EMP004',
      departmentId: financeDept?.id || null,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { wechatId: user.wechatId },
      update: user,
      create: user,
    });
  }
}

// 分配用户角色
async function seedUserRoles() {
  console.log('Seeding user roles...');
  
  const users = await prisma.user.findMany();
  const roles = await prisma.role.findMany();
  
  // 角色映射
  const roleMapping = [
    { userWechatId: 'wechat_admin', roleCode: 'ADMIN' },
    { userWechatId: 'wechat_business01', roleCode: 'BUSINESS_STAFF' },
    { userWechatId: 'wechat_ops01', roleCode: 'OPERATIONS_STAFF' },
    { userWechatId: 'wechat_finance01', roleCode: 'FINANCE_STAFF' },
  ];

  for (const mapping of roleMapping) {
    const user = users.find(u => u.wechatId === mapping.userWechatId);
    const role = roles.find(r => r.code === mapping.roleCode);
    
    if (user && role) {
      await prisma.userRole.upsert({
        where: { 
          userId_roleId: { 
            userId: user.id, 
            roleId: role.id 
          } 
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
  }
}

// 创建示例开店计划
async function seedStorePlans() {
  console.log('Seeding store plans...');
  
  const regions = await prisma.region.findMany({ where: { level: 1 } });
  const entities = await prisma.companyEntity.findMany();
  const users = await prisma.user.findMany();
  
  if (regions.length > 0 && entities.length > 0 && users.length > 0) {
    const storePlans = [
      {
        planCode: 'SP2024Q1001',
        title: '2024年第一季度开店计划-北京',
        year: 2024,
        quarter: 1,
        regionId: regions[0].id,
        entityId: entities[0].id,
        storeType: StoreType.DIRECT,
        plannedCount: 5,
        budget: new Decimal(1500000.00),
        priority: Priority.HIGH,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        description: '2024年第一季度在北京地区开设5家直营店',
        createdById: users[0].id,
      },
      {
        planCode: 'SP2024Q2001',
        title: '2024年第二季度开店计划-上海',
        year: 2024,
        quarter: 2,
        regionId: regions[1]?.id || regions[0].id,
        entityId: entities[1]?.id || entities[0].id,
        storeType: StoreType.FRANCHISE,
        plannedCount: 8,
        budget: new Decimal(2000000.00),
        priority: Priority.MEDIUM,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        description: '2024年第二季度在上海地区发展8家加盟店',
        createdById: users[1]?.id || users[0].id,
      },
    ];

    for (const plan of storePlans) {
      await prisma.storePlan.upsert({
        where: { planCode: plan.planCode },
        update: plan,
        create: plan,
      });
    }
  }
}

async function main() {
  console.log('Starting database seed...');
  
  try {
    await seedRoles();
    await seedPermissions();
    await seedRegions();
    await seedCompanyEntities();
    await seedSuppliers();
    await seedApprovalTemplates();
    await seedDepartments();
    await seedUsers();
    await seedUserRoles();
    await seedStorePlans();
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Seed process failed:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });