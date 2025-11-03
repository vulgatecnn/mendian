# 门店档案管理模块

## 概述

门店档案管理模块用于管理门店的主数据和完整生命周期信息，包括基本信息、跟进历史、工程历史等。

## 功能特性

### 1. 门店档案列表 (StoreList.tsx)

- **多维度筛选**：支持按门店名称、编码、状态、类型、经营模式、区域等条件筛选
- **数据展示**：展示门店编码、名称、状态、类型、地址、负责人等关键信息
- **操作功能**：
  - 查看门店详情
  - 编辑门店信息
  - 删除门店档案
  - 新建门店档案

### 2. 门店档案表单 (StoreForm.tsx)

- **基本信息**：门店编码、名称、类型、经营模式、开业日期
- **地址信息**：省份、城市、区县、详细地址、业务大区
- **负责人信息**：店长、商务负责人
- **关联信息**：关联跟进单、关联工程单（可选）
- **表单验证**：必填字段验证、数据格式验证

### 3. 门店档案详情 (StoreDetail.tsx)

#### Tab 页展示

**基本信息 Tab**
- 门店基本信息展示
- 地址信息展示
- 负责人信息展示
- 状态信息展示

**跟进历史 Tab**
- 商务条件信息
- 盈利测算结果（ROI、回本周期、贡献率、总投资）
- 合同信息
- 法人主体信息

**工程历史 Tab**
- 施工进度时间线
- 工程里程碑（时间线组件展示）
- 设计图纸列表
- 交付清单信息

#### 操作功能

- **编辑**：跳转到编辑页面
- **变更状态**：支持门店状态流转（筹备中、开业中、营业中、已闭店、已取消）
- **返回列表**：返回门店档案列表

## 数据模型

### StoreProfile（门店档案）

```typescript
interface StoreProfile {
  id: number
  store_code: string              // 门店编码
  store_name: string              // 门店名称
  province: string                // 省份
  city: string                    // 城市
  district: string                // 区县
  address: string                 // 详细地址
  business_region_id: number      // 业务大区ID
  store_type: StoreTypeCode       // 门店类型
  operation_mode: OperationMode   // 经营模式
  status: StoreStatus             // 门店状态
  opening_date?: string           // 开业日期
  closing_date?: string           // 闭店日期
  store_manager_id?: number       // 店长ID
  business_manager_id?: number    // 商务负责人ID
  follow_up_record_id?: number    // 关联跟进单ID
  construction_order_id?: number  // 关联工程单ID
  created_at: string              // 创建时间
  updated_at: string              // 更新时间
}
```

### StoreFullInfo（门店完整档案）

```typescript
interface StoreFullInfo {
  basic_info: StoreProfile        // 基本信息
  follow_up_info?: {              // 跟进历史
    business_terms: object        // 商务条件
    contract_info: object         // 合同信息
    profit_calculation: object    // 盈利测算
    legal_entity: object          // 法人主体
  }
  construction_info?: {           // 工程历史
    design_files: array           // 设计图纸
    construction_timeline: object // 施工时间线
    milestones: array             // 里程碑
    delivery_checklist: object    // 交付清单
  }
}
```

## API 接口

### 门店档案管理

- `GET /api/archive/stores/` - 查询门店档案列表
- `GET /api/archive/stores/:id/` - 获取门店档案详情
- `GET /api/archive/stores/:id/full/` - 获取门店完整档案
- `POST /api/archive/stores/` - 创建门店档案
- `PUT /api/archive/stores/:id/` - 更新门店档案
- `DELETE /api/archive/stores/:id/` - 删除门店档案
- `POST /api/archive/stores/:id/change-status/` - 变更门店状态

## 状态说明

### 门店状态 (StoreStatus)

- `preparing` - 筹备中：门店正在筹备阶段
- `opening` - 开业中：门店正在开业准备阶段
- `operating` - 营业中：门店正常营业
- `closed` - 已闭店：门店已关闭
- `cancelled` - 已取消：门店计划已取消

### 门店类型 (StoreTypeCode)

- `direct` - 直营店
- `franchise` - 加盟店
- `joint` - 联营店

### 经营模式 (OperationMode)

- `self_operated` - 自营
- `franchised` - 加盟
- `joint_venture` - 联营

## 使用说明

### 创建门店档案

1. 点击"新建门店档案"按钮
2. 填写基本信息（门店编码、名称、类型等）
3. 填写地址信息（省市区、详细地址、业务大区）
4. 选择负责人（店长、商务负责人）
5. 可选：关联跟进单和工程单
6. 点击"创建"按钮保存

### 查看门店档案

1. 在列表中点击"查看"按钮
2. 切换不同 Tab 页查看不同信息：
   - 基本信息：查看门店基本资料
   - 跟进历史：查看商务条件、盈利测算、合同信息
   - 工程历史：查看施工进度、里程碑、设计图纸

### 编辑门店档案

1. 在详情页点击"编辑"按钮
2. 修改需要更新的信息
3. 点击"保存"按钮提交更新

### 变更门店状态

1. 在详情页点击"变更状态"按钮
2. 选择新的门店状态
3. 填写变更原因（可选）
4. 填写生效日期（可选）
5. 点击"确定"按钮提交变更

## 注意事项

1. **必填字段**：门店编码、名称、类型、经营模式、地址信息、业务大区为必填项
2. **唯一性**：门店编码必须唯一
3. **关联数据**：删除门店档案前需确保没有其他业务数据引用
4. **状态流转**：门店状态变更会记录在操作日志中
5. **权限控制**：根据用户角色和数据权限控制可见的门店范围

## 待完善功能

1. 业务大区下拉列表需要从后端加载
2. 用户（店长、商务负责人）下拉列表需要从后端加载
3. 跟进单和工程单下拉列表需要从后端加载
4. 门店状态变更历史记录展示
5. 移动端适配优化
