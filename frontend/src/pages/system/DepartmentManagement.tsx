/**
 * 部门管理页面组件
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Tree,
  Button,
  Message,
  Spin,
  Space,
  Typography,
  Alert
} from '@arco-design/web-react'
import { IconSync, IconBranch } from '@arco-design/web-react/icon'
import DepartmentService from '../../api/departmentService'
import { Department } from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import { usePermission } from '../../hooks/usePermission'
import styles from './DepartmentManagement.module.css'

const { Title } = Typography

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 权限检查
  const { hasPermission } = usePermission()

  // 加载部门树数据
  const loadDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DepartmentService.getDepartmentTree()
      setDepartments(data)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || '获取部门数据失败'
      setError(errorMessage)
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 从企业微信同步部门
  const handleSyncFromWechat = async () => {
    try {
      setSyncLoading(true)
      const result = await DepartmentService.syncFromWechat()
      
      if (result.success) {
        Message.success(
          `同步成功！共同步 ${result.synced_count} 个部门，更新 ${result.updated_count} 个部门`
        )
        // 重新加载部门数据
        await loadDepartments()
      } else {
        Message.error(result.message || '同步失败')
        if (result.errors && result.errors.length > 0) {
          console.error('同步错误详情:', result.errors)
        }
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || '同步失败，请稍后重试'
      Message.error(errorMessage)
    } finally {
      setSyncLoading(false)
    }
  }

  // 转换部门数据为 Tree 组件需要的格式
  const convertToTreeData = (departments: Department[]): any[] => {
    return departments.map(dept => ({
      key: dept.id.toString(),
      title: (
        <div className={styles.departmentItem}>
          <IconBranch />
          <span>{dept.name}</span>
          <span className={styles.departmentId}>
            (ID: {dept.wechat_dept_id})
          </span>
        </div>
      ),
      children: dept.children ? convertToTreeData(dept.children) : undefined
    }))
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadDepartments()
  }, [])

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={3} className={styles.title}>
            部门管理
          </Title>
          <div className={styles.actions}>
            <Space>
              <PermissionGuard permission="system.department.sync">
                <Button
                  type="primary"
                  icon={<IconSync />}
                  loading={syncLoading}
                  onClick={handleSyncFromWechat}
                >
                  从企业微信同步
                </Button>
              </PermissionGuard>
              <Button
                icon={<IconBranch />}
                onClick={loadDepartments}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            title="加载失败"
            content={error}
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '20px' }}
          />
        )}

        <Spin loading={loading} style={{ width: '100%' }}>
          {departments.length > 0 ? (
            <Tree
              treeData={convertToTreeData(departments)}
              defaultExpandedKeys={departments.map(d => d.id.toString())}
              showLine
              blockNode
              className={styles.treeContainer}
            />
          ) : (
            !loading && (
              <div className={styles.emptyState}>
                <IconBranch className={styles.emptyIcon} />
                <div>暂无部门数据</div>
                <div className={styles.emptyText}>
                  点击"从企业微信同步"按钮获取部门数据
                </div>
              </div>
            )
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default DepartmentManagement