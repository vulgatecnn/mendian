# API Mock 目录

本目录用于存放外部API的Mock文件。

## 目录结构

- `wechat/` - 企业微信API Mock
- `third-party/` - 第三方服务API Mock
- `payment/` - 支付相关API Mock
- `sms/` - 短信服务API Mock

## 命名规范

Mock文件命名格式：`[ServiceName].api.mock.ts`

示例：
- `wechatWork.api.mock.ts`
- `alipay.api.mock.ts`
- `smsService.api.mock.ts`

## Mock 要求

- 模拟真实的API响应结构
- 包含成功和失败情况
- 支持参数化配置
- 提供清晰的使用文档
