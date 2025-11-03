/**
 * 交付清单详情页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Message,
  Typography,
  Tabs,
  Table,
  Checkbox,
  Upload,
  Modal,
  Input
} from '@arco-design/web-react'
import {
  IconLeft,
  IconUpload,
  IconDownload,
  IconPlus
} from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import { PreparationService } from '../../api'
import {
  DeliveryChecklist,
  DeliveryStatus,
  DeliveryItem,
  DeliveryDocument
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'

const { Title } = Typography
const TabPane = Tabs.TabPane

// 交付状态配置
const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, { text: string; color: string }> = {
  preparing: { text: '准备中', color: 'blue' },
  in_progress: { text: '进行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' }
}

const DeliveryDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [checklist, setChecklist] = useState<DeliveryChecklist | null>(null)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [addItemVisible, setAddItemVisible] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemUnit, setNewItemUnit] = useState('')

  // 加载交付清单详情
  const loadChecklistDetail = async () => {
    if (!id) return

    try {
      const response = await PreparationService.getDeliveryChecklistDetail(Number(id))
      setChecklist(response)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载交付清单详情失败')
    }
  }

  // 更新交付项状态
  const handleToggleItemStatus = async (item: DeliveryItem) => {
    if (!id || !item.id) return

    try {
      await PreparationService.updateDeliveryItemStatus(Number(id), item.id, !item.is_completed)
      Message.success('更新交付项状态成功')
      loadChecklistDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '更新失败')
    }
  }

  // 上传交付文档
  const handleUploadDocuments = async (fileList: any[]) => {
    if (!id) return

    try {
      const formData = new FormData()
      fileList.forEach(file => {
        formData.append('files', file.originFile)
      })

      await PreparationService.uploadDeliveryDocuments(Number(id), formData)
      Message.success('上传交付文档成功')
      setUploadVisible(false)
      loadChecklistDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '上传失败')
    }
  }

  // 添加交付项
  const handleAddItem = () => {
    // 这里应该调用 API 添加交付项
    // 由于后端 API 可能需要支持，这里先显示提示
    Message.info('添加交付项功能待后端 API 支持')
    setAddItemVisible(false)
  }

  useEffect(() => {
    loadChecklistDetail()
  }, [id])

  if (!checklist) {
    return <div style={{ padding: '20px' }}>加载中...</div>
  }

  const statusConfig = DELIVERY_STATUS_CONFIG[checklist.status]

  // 交付项表格列配置
  const itemColumns = [
    {
      title: '完成状态',
      dataIndex: 'is_completed',
      width: 100,
      render: (isCompleted: boolean, record: DeliveryItem) => (
        <Checkbox
          checked={isCompleted}
          onChange={() => handleToggleItemStatus(record)}
          disabled={checklist.status === 'completed'}
        >
          {isCompleted ? '已完成' : '未完成'}
        </Checkbox>
      )
    },
    {
      title: '交付项名称',
      dataIndex: 'name',
      width: 200
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 120
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 80
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-'
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      width: 200,
      render: (remarks: string) => remarks || '-'
    }
  ]

  // 交付文档表格列配置
  const documentColumns = [
    {
      title: '文档名称',
      dataIndex: 'name',
      width: 200
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 120
    },
    {
      title: '文件类型',
      dataIndex: 'type',
      width: 100
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      width: 100,
      render: (size: number) => {
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
        return `${(size / (1024 * 1024)).toFixed(2)} MB`
      }
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-'
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      width: 200,
      render: (remarks: string) => remarks || '-'
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 100,
      render: (_: any, record: DeliveryDocument) => (
        <Button
          type="text"
          size="small"
          icon={<IconDownload />}
          onClick={() => window.open(record.url)}
        >
          下载
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题和操作按钮 */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<IconLeft />} onClick={() => navigate('/store-preparation/delivery')}>
            返回
          </Button>
          <Title heading={3} style={{ margin: 0 }}>
            交付清单详情 - {checklist.checklist_no}
          </Title>
          <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
        </Space>
        <Space>
          {checklist.status !== 'completed' && (
            <PermissionGuard permission="preparation.delivery.upload">
              <Button
                icon={<IconUpload />}
                onClick={() => setUploadVisible(true)}
              >
                上传文档
              </Button>
            </PermissionGuard>
          )}
        </Space>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: '20px' }}>
        <Descriptions
          column={2}
          data={[
            {
              label: '清单编号',
              value: checklist.checklist_no
            },
            {
              label: '门店名称',
              value: checklist.store_name
            },
            {
              label: '交付状态',
              value: <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            },
            {
              label: '关联工程单',
              value: checklist.construction_order?.order_no || '-'
            },
            {
              label: '交付日期',
              value: checklist.delivery_date || '-'
            },
            {
              label: '创建人',
              value: checklist.created_by_info?.full_name || '-'
            },
            {
              label: '创建时间',
              value: checklist.created_at ? new Date(checklist.created_at).toLocaleString('zh-CN') : '-'
            }
          ]}
        />
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs defaultActiveTab="items">
          <TabPane key="items" title="交付项清单">
            <div style={{ marginBottom: '16px' }}>
              {checklist.status !== 'completed' && (
                <Button
                  type="primary"
                  size="small"
                  icon={<IconPlus />}
                  onClick={() => setAddItemVisible(true)}
                >
                  添加交付项
                </Button>
              )}
            </div>
            <Table
              columns={itemColumns}
              data={checklist.delivery_items || []}
              pagination={false}
              rowKey={(record: DeliveryItem) => record.id?.toString() || Math.random().toString()}
            />
          </TabPane>

          <TabPane key="documents" title="交付文档">
            <Table
              columns={documentColumns}
              data={checklist.documents || []}
              pagination={false}
              rowKey={(record: DeliveryDocument) => record.id?.toString() || Math.random().toString()}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 上传文档弹窗 */}
      <Modal
        title="上传交付文档"
        visible={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        footer={null}
      >
        <Upload
          multiple
          onChange={(fileList) => {
            if (fileList.length > 0) {
              handleUploadDocuments(fileList)
            }
          }}
        >
          <Button icon={<IconUpload />}>选择文件</Button>
        </Upload>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#86909c' }}>
          支持上传各类文档文件
        </div>
      </Modal>

      {/* 添加交付项弹窗 */}
      <Modal
        title="添加交付项"
        visible={addItemVisible}
        onCancel={() => setAddItemVisible(false)}
        onOk={handleAddItem}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="交付项名称"
            value={newItemName}
            onChange={setNewItemName}
          />
          <Input
            placeholder="类别"
            value={newItemCategory}
            onChange={setNewItemCategory}
          />
          <Input
            placeholder="数量"
            value={newItemQuantity.toString()}
            onChange={(value) => setNewItemQuantity(Number(value) || 1)}
          />
          <Input
            placeholder="单位"
            value={newItemUnit}
            onChange={setNewItemUnit}
          />
        </Space>
      </Modal>
    </div>
  )
}

export default DeliveryDetail
