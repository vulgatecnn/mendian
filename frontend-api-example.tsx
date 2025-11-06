/**
 * 前端API调用实际示例
 * 展示React组件如何使用后端API服务
 */
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Message, 
  Tag, 
  Spin,
  Typography 
} from '@arco-design/web-react'
import { 
  ExpansionService, 
  PlanService, 
  UserService, 
  AuthService 
} from './src/api'

const { Title, Text } = Typography

// 用户管理组件示例
const UserManagementExample: React.FC = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 加载用户列表 - 实际API调用
  const loadUsers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      
      // 🔥 这里是实际的API调用
      const response = await UserService.getUsers({
        page,
        page_size: pageSize,
        is_active: true
      })
      
      setUsers(response.results)
      setPagination({
        current: page,
        pageSize,
        total: response.count
      })
      
      Message.success(`成功加载 ${response.count} 个用户`)
    } catch (error: any) {
      Message.error(`加载用户失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 同步企业微信用户 - 实际API调用
  const syncWechatUsers = async () => {
    try {
      setLoading(true)
      
      // 🔥 调用企业微信同步API
      const result = await UserService.syncFromWechat()
      
      if (result.code === 0) {
        Message.success(`同步成功！新增 ${result.data.created} 个用户`)
        loadUsers() // 重新加载用户列表
      } else {
        Message.error(`同步失败: ${result.message}`)
      }
    } catch (error: any) {
      Message.error(`同步异常: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      render: (dept: any) => dept?.name || '-'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '激活' : '禁用'}
        </Tag>
      )
    }
  ]

  return (
    <Card 
      title="用户管理 - API调用示例"
      extra={
        <Space>
          <Button onClick={() => loadUsers()}>
            刷新
          </Button>
          <Button type="primary" onClick={syncWechatUsers}>
            同步企业微信
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        data={users}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => loadUsers(page, pageSize)
        }}
      />
    </Card>
  )
}

// 拓店管理组件示例
const ExpansionManagementExample: React.FC = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)

  // 加载候选点位 - 实际API调用
  const loadLocations = async () => {
    try {
      setLoading(true)
      
      // 🔥 调用拓店管理API
      const response = await ExpansionService.getLocations({
        page: 1,
        page_size: 20,
        status: 'available'
      })
      
      setLocations(response.results)
      Message.success(`加载了 ${response.count} 个候选点位`)
    } catch (error: any) {
      Message.error(`加载失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 创建新点位 - 实际API调用
  const createLocation = async () => {
    try {
      // 🔥 调用创建点位API
      const newLocation = await ExpansionService.createLocation({
        name: '测试点位',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        address: '科技园南区',
        area: 100,
        rent: 15000,
        business_region_id: 1,
        status: 'available'
      })
      
      Message.success('创建点位成功！')
      loadLocations() // 重新加载列表
    } catch (error: any) {
      Message.error(`创建失败: ${error.message}`)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  return (
    <Card 
      title="拓店管理 - API调用示例"
      extra={
        <Space>
          <Button onClick={loadLocations}>
            刷新点位
          </Button>
          <Button type="primary" onClick={createLocation}>
            创建测试点位
          </Button>
        </Space>
      }
    >
      <Spin loading={loading}>
        <div style={{ minHeight: 200 }}>
          {locations.length > 0 ? (
            <div>
              <Text>找到 {locations.length} 个候选点位：</Text>
              {locations.map((location: any) => (
                <Card key={location.id} size="small" style={{ margin: '10px 0' }}>
                  <Space>
                    <Text strong>{location.name}</Text>
                    <Text>{location.province} {location.city}</Text>
                    <Tag color="blue">{location.status}</Tag>
                  </Space>
                </Card>
              ))}
            </div>
          ) : (
            <Text>暂无候选点位数据</Text>
          )}
        </div>
      </Spin>
    </Card>
  )
}

// 开店计划组件示例
const PlanManagementExample: React.FC = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)

  // 加载开店计划 - 实际API调用
  const loadPlans = async () => {
    try {
      setLoading(true)
      
      // 🔥 调用开店计划API
      const response = await PlanService.getPlans({
        page: 1,
        page_size: 10,
        status: 'published'
      })
      
      setPlans(response.results)
      Message.success(`加载了 ${response.count} 个开店计划`)
    } catch (error: any) {
      Message.error(`加载失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 创建新计划 - 实际API调用
  const createPlan = async () => {
    try {
      // 🔥 调用创建计划API
      const newPlan = await PlanService.createPlan({
        name: '2024年Q4开店计划',
        plan_type: 'quarterly',
        year: 2024,
        quarter: 4,
        target_count: 10,
        description: 'API测试创建的计划'
      })
      
      Message.success('创建计划成功！')
      loadPlans() // 重新加载列表
    } catch (error: any) {
      Message.error(`创建失败: ${error.message}`)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  return (
    <Card 
      title="开店计划 - API调用示例"
      extra={
        <Space>
          <Button onClick={loadPlans}>
            刷新计划
          </Button>
          <Button type="primary" onClick={createPlan}>
            创建测试计划
          </Button>
        </Space>
      }
    >
      <Spin loading={loading}>
        <div style={{ minHeight: 200 }}>
          {plans.length > 0 ? (
            <div>
              <Text>找到 {plans.length} 个开店计划：</Text>
              {plans.map((plan: any) => (
                <Card key={plan.id} size="small" style={{ margin: '10px 0' }}>
                  <Space>
                    <Text strong>{plan.name}</Text>
                    <Text>目标: {plan.target_count} 家</Text>
                    <Tag color="green">{plan.status}</Tag>
                  </Space>
                </Card>
              ))}
            </div>
          ) : (
            <Text>暂无开店计划数据</Text>
          )}
        </div>
      </Spin>
    </Card>
  )
}

// 认证示例组件
const AuthExample: React.FC = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // 登录 - 实际API调用
  const handleLogin = async () => {
    try {
      setLoading(true)
      
      // 🔥 调用登录API
      const response = await AuthService.loginByPassword({
        username: 'admin',
        password: 'admin123'
      })
      
      // 保存Token
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      
      setUser(response.user)
      Message.success(`登录成功！欢迎 ${response.user.name}`)
    } catch (error: any) {
      Message.error(`登录失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 登出 - 实际API调用
  const handleLogout = async () => {
    try {
      // 🔥 调用登出API
      await AuthService.logout()
      
      // 清除Token
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      setUser(null)
      Message.success('登出成功！')
    } catch (error: any) {
      Message.error(`登出失败: ${error.message}`)
    }
  }

  return (
    <Card title="认证服务 - API调用示例">
      <Space direction="vertical" style={{ width: '100%' }}>
        {user ? (
          <div>
            <Text>当前用户: <Text strong>{user.name}</Text> ({user.username})</Text>
            <br />
            <Button onClick={handleLogout} style={{ marginTop: 10 }}>
              登出
            </Button>
          </div>
        ) : (
          <div>
            <Text>未登录</Text>
            <br />
            <Button 
              type="primary" 
              loading={loading}
              onClick={handleLogin}
              style={{ marginTop: 10 }}
            >
              测试登录 (admin/admin123)
            </Button>
          </div>
        )}
      </Space>
    </Card>
  )
}

// 主应用组件
const APIExampleApp: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <Title level={1}>🚀 前端API调用实际示例</Title>
      <Text type="secondary">
        以下组件展示了React前端如何实际调用后端API服务
      </Text>
      
      <div style={{ marginTop: 20 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <AuthExample />
          <UserManagementExample />
          <ExpansionManagementExample />
          <PlanManagementExample />
        </Space>
      </div>
    </div>
  )
}

export default APIExampleApp

/**
 * 🔥 关键API调用总结：
 * 
 * 1. 认证服务 (AuthService):
 *    - loginByPassword() - 用户名密码登录
 *    - logout() - 用户登出
 * 
 * 2. 用户管理 (UserService):
 *    - getUsers() - 获取用户列表
 *    - syncFromWechat() - 同步企业微信用户
 * 
 * 3. 拓店管理 (ExpansionService):
 *    - getLocations() - 获取候选点位
 *    - createLocation() - 创建新点位
 * 
 * 4. 开店计划 (PlanService):
 *    - getPlans() - 获取开店计划
 *    - createPlan() - 创建新计划
 * 
 * 所有API调用都包含：
 * ✅ 错误处理
 * ✅ 加载状态管理
 * ✅ 用户反馈（Message提示）
 * ✅ 数据状态更新
 * ✅ Token自动管理
 */