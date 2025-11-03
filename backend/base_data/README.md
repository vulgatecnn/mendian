# 基础数据管理模块 (base_data)

## 概述

基础数据管理模块提供系统的基础数据管理功能，包括业务大区、供应商、法人主体、客户和商务预算的管理。

## 功能特性

### 1. 业务大区管理
- 管理企业的业务经营区域
- 支持关联省份列表
- 支持设置大区负责人
- 提供启用/停用状态管理

### 2. 供应商管理
- 管理施工、设备、材料等各类供应商
- 记录供应商联系信息和企业信息
- 支持合作状态管理（合作中/已停止）
- 提供合作中供应商快速查询接口

### 3. 法人主体管理
- 管理企业的法人主体信息
- 记录工商注册信息（统一社会信用代码、法定代表人等）
- 支持营运状态管理（营运中/已注销）
- 提供营运中主体快速查询接口

### 4. 客户管理
- 管理加盟商和合作伙伴信息
- 记录客户联系信息和合作信息
- 支持合作状态管理（合作中/已终止）
- 提供合作中客户快速查询接口

### 5. 商务预算管理
- 管理门店开设的预算配置
- 支持预算明细的 JSON 格式存储
- 支持按业务大区设置预算
- 支持有效期管理
- 提供启用预算快速查询接口

## 数据模型

### BusinessRegion (业务大区)
- `name`: 大区名称
- `code`: 大区编码（唯一）
- `description`: 描述
- `provinces`: 关联省份列表（JSON）
- `manager`: 负责人
- `is_active`: 是否启用

### Supplier (供应商)
- `name`: 供应商名称
- `code`: 供应商编码（唯一）
- `supplier_type`: 供应商类型（施工/设备/材料/其他）
- `contact_person`: 联系人
- `contact_phone`: 联系电话
- `credit_code`: 统一社会信用代码
- `status`: 合作状态（合作中/已停止）

### LegalEntity (法人主体)
- `name`: 主体名称
- `code`: 主体编码（唯一）
- `credit_code`: 统一社会信用代码（唯一）
- `legal_representative`: 法定代表人
- `registered_capital`: 注册资本
- `registration_date`: 注册日期
- `status`: 营运状态（营运中/已注销）

### Customer (客户)
- `name`: 客户名称
- `code`: 客户编码（唯一）
- `customer_type`: 客户类型（加盟商/合作伙伴/其他）
- `contact_person`: 联系人
- `contact_phone`: 联系电话
- `cooperation_start_date`: 合作开始日期
- `status`: 合作状态（合作中/已终止）

### Budget (商务预算)
- `name`: 预算名称
- `code`: 预算编码（唯一）
- `total_amount`: 预算总额
- `budget_items`: 预算明细（JSON）
- `business_region`: 适用大区
- `valid_from`: 生效日期
- `valid_to`: 失效日期
- `status`: 状态（启用/停用）

## API 接口

### 业务大区
- `GET /api/base-data/regions/` - 获取业务大区列表
- `POST /api/base-data/regions/` - 创建业务大区
- `GET /api/base-data/regions/{id}/` - 获取业务大区详情
- `PUT /api/base-data/regions/{id}/` - 更新业务大区
- `DELETE /api/base-data/regions/{id}/` - 删除业务大区

### 供应商
- `GET /api/base-data/suppliers/` - 获取供应商列表
- `POST /api/base-data/suppliers/` - 创建供应商
- `GET /api/base-data/suppliers/{id}/` - 获取供应商详情
- `PUT /api/base-data/suppliers/{id}/` - 更新供应商
- `DELETE /api/base-data/suppliers/{id}/` - 删除供应商
- `GET /api/base-data/suppliers/active/` - 获取合作中的供应商列表

### 法人主体
- `GET /api/base-data/entities/` - 获取法人主体列表
- `POST /api/base-data/entities/` - 创建法人主体
- `GET /api/base-data/entities/{id}/` - 获取法人主体详情
- `PUT /api/base-data/entities/{id}/` - 更新法人主体
- `DELETE /api/base-data/entities/{id}/` - 删除法人主体
- `GET /api/base-data/entities/operating/` - 获取营运中的法人主体列表

### 客户
- `GET /api/base-data/customers/` - 获取客户列表
- `POST /api/base-data/customers/` - 创建客户
- `GET /api/base-data/customers/{id}/` - 获取客户详情
- `PUT /api/base-data/customers/{id}/` - 更新客户
- `DELETE /api/base-data/customers/{id}/` - 删除客户
- `GET /api/base-data/customers/cooperating/` - 获取合作中的客户列表

### 商务预算
- `GET /api/base-data/budgets/` - 获取商务预算列表
- `POST /api/base-data/budgets/` - 创建商务预算
- `GET /api/base-data/budgets/{id}/` - 获取商务预算详情
- `PUT /api/base-data/budgets/{id}/` - 更新商务预算
- `DELETE /api/base-data/budgets/{id}/` - 删除商务预算
- `GET /api/base-data/budgets/active/` - 获取启用状态的预算列表

## 查询参数

所有列表接口支持以下查询参数：
- `search`: 搜索关键词
- `ordering`: 排序字段
- `page`: 页码
- `page_size`: 每页数量

各模块特定的过滤参数：
- 业务大区：`is_active`, `manager`
- 供应商：`supplier_type`, `status`
- 法人主体：`status`
- 客户：`customer_type`, `status`
- 商务预算：`status`, `business_region`

## 数据验证

### 删除前关联检查
- 业务大区：检查是否有关联的商务预算
- 供应商：检查是否有关联的工程单
- 法人主体：检查是否有关联的跟进单
- 客户：检查是否有关联的门店
- 商务预算：检查是否有关联的开店计划

### 唯一性验证
- 所有模块的编码（code）字段必须唯一
- 法人主体的统一社会信用代码必须唯一

### 业务规则验证
- 商务预算的失效日期不能早于生效日期

## 使用示例

### 创建业务大区
```python
POST /api/base-data/regions/
{
    "name": "华东大区",
    "code": "HD001",
    "description": "华东地区业务大区",
    "provinces": ["上海", "江苏", "浙江"],
    "manager": 1,
    "is_active": true
}
```

### 创建供应商
```python
POST /api/base-data/suppliers/
{
    "name": "XX施工公司",
    "code": "GYS001",
    "supplier_type": "construction",
    "contact_person": "张三",
    "contact_phone": "13800138000",
    "status": "cooperating"
}
```

### 查询合作中的供应商
```python
GET /api/base-data/suppliers/active/
```

## 测试

运行模块测试：
```bash
python manage.py test base_data
```

## 依赖关系

本模块被以下模块引用：
- `store_expansion`: 引用 BusinessRegion, LegalEntity
- `store_preparation`: 引用 Supplier
- `store_archive`: 引用 BusinessRegion, Customer
- `store_planning`: 引用 Budget, BusinessRegion
