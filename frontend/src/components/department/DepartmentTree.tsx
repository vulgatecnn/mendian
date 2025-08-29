/**
 * 部门树组件
 */
import React, { useState, useEffect } from 'react'
import {
  Tree,
  Input,
  Space,
  Card,
  Button,
  Tooltip,
  Badge,
  Tag,
  Dropdown,
  Modal,
  message,
  Empty
} from 'antd'
import {
  TeamOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import type { DataNode, TreeProps } from 'antd/es/tree'
import type { WeChatDepartment } from '../../types/wechat'
import { WeChatApiService } from '../../services/wechat/api'
const { Search } = Input
// 树节点数据扩展
interface DepartmentTreeNode extends DataNode {
  department?: WeChatDepartment
  userCount?: number
  isLeaf?: boolean
}
interface DepartmentTreeProps {
  /** 是否可选择 */
  checkable?: boolean
  /** 选中的部门IDs */
  checkedKeys?: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[]; }
  /** 选择变化回调 */
  onCheck?: TreeProps["onCheck"]
  /** 点击节点回调 */
  onSelect?: (selectedKeys: React.Key[], info: any) => void
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 是否显示用户数量 */
  showUserCount?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 高度 */
  height?: number
}
export const DepartmentTree: React.FC<DepartmentTreeProps> = ({
  checkable = false,
  checkedKeys,
  onCheck,
  onSelect,
  showActions = false,
  showUserCount = true,
  className,
  height = 400
}) => {
  const [treeData, setTreeData] = useState<DepartmentTreeNode[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<WeChatDepartment[]>([])
  useEffect(() => {
    loadDepartments()
  }, [])
  useEffect(() => {
    buildTreeData()
  }, [departments, searchValue])
  // 加载部门数据
  const loadDepartments = async () => {
    setLoading(true)
    try {
      const depts = await WeChatApiService.getDepartments()
      setDepartments(depts)
      // 默认展开根节点
      const rootKeys = depts
        .filter(dept => dept.parentid === 1)
        .map(dept => dept.id.toString())
      setExpandedKeys(rootKeys)
    } catch (error) {
      message.error('加载部门数据失败')
    } finally {
      setLoading(false)
    }
  }
  // 构建树数据
  const buildTreeData = () => {
    const filteredDepts = searchValue
      ? departments.filter(dept =>
          dept.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          (dept.name_en && dept.name_en.toLowerCase().includes(searchValue.toLowerCase()))
        )
      : departments
    const tree = buildTree(filteredDepts, 1)
    setTreeData(tree)
    // 搜索时自动展开匹配的节点
    if (searchValue) {
      const expandKeys = new Set<string>()
      const findParents = (deptId: number) => {
        const dept = departments.find(d => d.id === deptId)
        if (dept && dept.parentid !== 1) {
          expandKeys.add(dept.parentid.toString())
          findParents(dept.parentid)
        }
      }
      filteredDepts.forEach(dept => {
        expandKeys.add(dept.id.toString())
        findParents(dept.id)
      })
      setExpandedKeys(Array.from(expandKeys))
      setAutoExpandParent(true)
    }
  }
  // 递归构建树结构
  const buildTree = (depts: WeChatDepartment[], parentId: number): DepartmentTreeNode[] => {
    return depts
      .filter(dept => dept.parentid === parentId)
      .sort((a, b) => a.order - b.order)
      .map(dept => {
        const children = buildTree(depts, dept.id)
        const hasChildren = children.length > 0
        return {
          key: dept.id.toString(),
          title: renderTreeNodeTitle(dept),
          children,
          department: dept,
          isLeaf: !hasChildren,
          userCount: 0 // 可以通过API获取实际用户数量
        }
      })
  }
  // 渲染树节点标题
  const renderTreeNodeTitle = (dept: WeChatDepartment) => {
    const isHighlight = searchValue && 
      dept.name.toLowerCase().includes(searchValue.toLowerCase())
    const titleText = isHighlight ? (
      <span>
        {dept.name.split(new RegExp(`(${searchValue})`, 'gi')).map((text: any, index: number) =>
          text.toLowerCase() === searchValue.toLowerCase() ? (
            <span key={index} style={{ backgroundColor: '#ffc069', padding: '0 2px' }}>
              {text}
            </span>
          ) : (
            text
          )
        )}
      </span>
    ) : (
      <span>{dept.name}</span>
    )
    return (
      <Space size="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space size="small">
          <TeamOutlined />
          {titleText}
          <Tag color="blue">
            {dept.id}
          </Tag>
          {dept.name_en && (
            <Tag color="default">
              {dept.name_en}
            </Tag>
          )}
          {showUserCount && (
            <Badge
              count={0}
              size="small"
              style={{ backgroundColor: '#52c41a' }}
              showZero
            />
          )}
        </Space>
        {showActions && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'add',
                  icon: <PlusOutlined />,
                  label: '添加子部门',
                  onClick: () => handleAddSubDepartment(dept)
                },
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑部门',
                  onClick: () => handleEditDepartment(dept)
                },
                {
                  key: 'sync',
                  icon: <SyncOutlined />,
                  label: '同步部门',
                  onClick: () => handleSyncDepartment(dept)
                },
                {
                  type: 'divider'
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除部门',
                  danger: true,
                  onClick: () => handleDeleteDepartment(dept)
                }
              ]
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        )}
      </Space>
    )
  }
  // 处理树节点展开/收起
  const handleExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue)
    setAutoExpandParent(false)
  }
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (!value) {
      setAutoExpandParent(false)
    }
  }
  // 处理添加子部门
  const handleAddSubDepartment = (parentDept: WeChatDepartment) => {
    Modal.info({
      title: '添加子部门',
      content: `为部门"${parentDept.name}"添加子部门功能开发中...`,
    })
  }
  // 处理编辑部门
  const handleEditDepartment = (dept: WeChatDepartment) => {
    Modal.info({
      title: '编辑部门',
      content: `编辑部门"${dept.name}"功能开发中...`,
    })
  }
  // 处理同步部门
  const handleSyncDepartment = (dept: WeChatDepartment) => {
    Modal.confirm({
      title: '同步部门',
      content: `确定要同步部门"${dept.name}"及其子部门吗？`,
      onOk: async () => {
        try {
          await WeChatApiService.syncContacts({
            departmentIds: [dept.id]
          })
          message.success('部门同步成功')
          loadDepartments()
        } catch (error) {
          message.error('部门同步失败')
        }
      }
    })
  }
  // 处理删除部门
  const handleDeleteDepartment = (dept: WeChatDepartment) => {
    Modal.confirm({
      title: '删除部门',
      content: `确定要删除部门"${dept.name}"吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: () => {
        message.info('删除功能开发中...')
      }
    })
  }
  return (
    <div className={className}>
      <Card
        title={
          <Space>
            <BranchesOutlined />
            <span>组织架构</span>
          </Space>
        }
        size="small"
        extra={
          showActions && (
            <Tooltip title="刷新">
              <Button
                type="text"
                icon={<SyncOutlined />}
                loading={loading}
                onClick={loadDepartments}
              />
            </Tooltip>
          )
        }
      >
        {/* 搜索框 */}
        <Search
          style={{ marginBottom: 8 }}
          placeholder="搜索部门..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          prefix={<SearchOutlined />}
        />
        {/* 部门树 */}
        {treeData.length > 0 ? (
          <Tree
            checkable={checkable}
            checkedKeys={checkedKeys || []}
            onCheck={onCheck}
            onSelect={onSelect}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={handleExpand}
            treeData={treeData}
            height={height}
            showLine={{ showLeafIcon: false }}
            blockNode
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '8px'
            }}
          />
        ) : (
          <div style={{ 
            height: height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '6px'
          }}>
            {loading ? (
              <Space>
                <SyncOutlined spin />
                <span>加载中...</span>
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无部门数据"
              >
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={loadDepartments}
                >
                  立即同步
                </Button>
              </Empty>
            )}
          </div>
        )}
        {/* 统计信息 */}
        {treeData.length > 0 && (
          <div style={{ 
            marginTop: 8, 
            padding: '8px 12px', 
            background: '#fafafa', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <Space>
              <span>共 {departments.length} 个部门</span>
              {searchValue && (
                <span>
                  · 搜索到 {treeData.length} 个匹配部门
                </span>
              )}
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}
export default DepartmentTree