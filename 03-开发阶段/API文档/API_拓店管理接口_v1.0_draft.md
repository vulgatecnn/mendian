# 拓店管理模块API设计文档

## 1. 模块概览

### 1.1 功能描述
拓店管理模块是好饭碗门店生命周期管理系统中的核心业务模块，负责管理门店候选点位的全流程跟进。主要功能包括：
- 候选点位信息录入和管理
- 地理位置和地图展示
- 跟进记录追踪
- 商务条件谈判记录
- 点位筛选和统计分析

### 1.2 核心实体
- **CandidateLocation**：候选点位实体
- **FollowUpRecord**：点位跟进记录实体

### 1.3 状态流转
候选点位状态：
- PENDING：待评估
- EVALUATING：评估中
- FOLLOWING：跟进中
- NEGOTIATING：商务谈判
- CONTRACTED：已签约
- REJECTED：已拒绝
- SUSPENDED：暂停

## 2. API接口清单

### 2.1 候选点位管理
| 接口描述 | HTTP方法 | 路径 | 权限 |
|----------|----------|------|------|
| 创建候选点位 | POST | `/api/v1/candidate-locations` | 商务人员、运营人员 |
| 更新候选点位 | PUT | `/api/v1/candidate-locations/{id}` | 商务人员、运营人员 |
| 获取候选点位详情 | GET | `/api/v1/candidate-locations/{id}` | 所有授权用户 |
| 候选点位列表查询 | GET | `/api/v1/candidate-locations` | 所有授权用户 |
| 删除候选点位 | DELETE | `/api/v1/candidate-locations/{id}` | 商务人员、运营人员 |
| 批量导入候选点位 | POST | `/api/v1/candidate-locations/import` | 商务人员 |
| 导出候选点位 | GET | `/api/v1/candidate-locations/export` | 商务人员、运营人员 |

### 2.2 跟进记录管理
| 接口描述 | HTTP方法 | 路径 | 权限 |
|----------|----------|------|------|
| 创建跟进记录 | POST | `/api/v1/follow-up-records` | 商务人员、运营人员 |
| 更新跟进记录 | PUT | `/api/v1/follow-up-records/{id}` | 商务人员、运营人员 |
| 获取跟进记录详情 | GET | `/api/v1/follow-up-records/{id}` | 所有授权用户 |
| 跟进记录列表查询 | GET | `/api/v1/follow-up-records` | 所有授权用户 |
| 删除跟进记录 | DELETE | `/api/v1/follow-up-records/{id}` | 商务人员、运营人员 |

### 2.3 统计分析
| 接口描述 | HTTP方法 | 路径 | 权限 |
|----------|----------|------|------|
| 候选点位状态统计 | GET | `/api/v1/candidate-locations/statistics/status` | 商务人员、运营人员 |
| 按地区统计候选点位 | GET | `/api/v1/candidate-locations/statistics/region` | 商务人员、运营人员 |
| 跟进效率统计 | GET | `/api/v1/follow-up-records/statistics/efficiency` | 商务人员、运营人员 |

## 3. 接口详细设计

### 3.1 创建候选点位
#### 请求
```json
{
  "locationCode": "string", // 点位编号
  "regionId": "string", // 所属地区ID
  "name": "string", // 点位名称
  "address": "string", // 地址
  "coordinates": "string", // 经纬度
  "area": 100.50, // 面积
  "rentPrice": 5000.00, // 租金
  "status": "PENDING", // 状态
  "discoveryDate": "2025-08-29T10:00:00Z" // 发现日期
}
```

#### 响应
```json
{
  "id": "string", // 候选点位ID
  "locationCode": "string",
  "status": "PENDING",
  "createdAt": "2025-08-29T10:00:00Z"
}
```

### 3.2 创建跟进记录
#### 请求
```json
{
  "candidateLocationId": "string",
  "type": "SITE_VISIT", // 跟进类型
  "title": "实地考察", 
  "content": "对候选点位进行详细考察",
  "assigneeId": "string", // 跟进人
  "nextFollowUpDate": "2025-09-15T14:00:00Z"
}
```

#### 响应
```json
{
  "id": "string", // 跟进记录ID
  "status": "PENDING",
  "createdAt": "2025-08-29T10:00:00Z"
}
```

### 3.3 候选点位状态统计
#### 响应
```json
{
  "PENDING": 10,
  "EVALUATING": 5,
  "FOLLOWING": 8,
  "NEGOTIATING": 3,
  "CONTRACTED": 2,
  "REJECTED": 1,
  "SUSPENDED": 1
}
```

## 4. 数据模型定义

### 4.1 候选点位模型
| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| id | string | 唯一标识 | 必填 |
| locationCode | string | 点位编号 | 唯一 |
| regionId | string | 所属地区ID | 必填 |
| name | string | 点位名称 | 必填 |
| address | string | 详细地址 | 必填 |
| coordinates | string | 经纬度 | 可选 |
| area | decimal | 面积(平方米) | 可选 |
| rentPrice | decimal | 租金 | 可选 |
| status | enum | 点位状态 | 必填 |
| discoveryDate | datetime | 发现日期 | 默认当前时间 |

### 4.2 跟进记录模型
| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| id | string | 唯一标识 | 必填 |
| candidateLocationId | string | 关联候选点位ID | 必填 |
| assigneeId | string | 跟进人ID | 必填 |
| type | enum | 跟进类型 | 必填 |
| title | string | 跟进主题 | 必填 |
| content | string | 跟进内容 | 必填 |
| status | string | 跟进状态 | 默认PENDING |
| nextFollowUpDate | datetime | 下次跟进日期 | 可选 |

## 5. 错误码定义

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| EXP_001 | 候选点位不存在 | 404 |
| EXP_002 | 权限不足 | 403 |
| EXP_003 | 参数验证失败 | 400 |
| EXP_004 | 重复的点位编号 | 409 |
| EXP_005 | 跟进记录创建失败 | 500 |

## 6. 业务规则与约束

1. 候选点位状态变更遵循严格的状态机流程
2. 跟进记录必须关联到具体的候选点位
3. 地理位置信息需要经过地理编码和验证
4. 跟进记录支持多种类型（电话、实地、商务谈判等）
5. 商务人员可以批量导入和导出候选点位信息
6. 所有操作记录将被审计日志系统追踪

## 7. 系统间集成

- 与开店计划模块通过`storePlanId`建立关联
- 通过企业微信API实现跟进通知和协作
- 支持地图服务API集成（如高德地图）进行地理信息处理

---

*本文档为好饭碗门店生命周期管理系统拓店管理模块API设计，版本 v1.0*