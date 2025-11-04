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
  List,
  Upload,
  Modal,
  Progress,
  Checkbox
} from '@arco-design/web-react'
import {
  IconLeft,
  IconUpload,
  IconDownload,
  IconEdit
} from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import { PreparationService } from '../../api'
import {
  DeliveryChecklist,
  DeliveryStatus,
  DeliveryItem
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
  const [loading, setLoading] = useState(false)

  // 加载交付清单详情
  const loadChecklistDetail = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await PreparationService.getDeliveryChecklistDetail(Number(id))
      setChecklist(response)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载交付清单详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 上传交付文档
  const handleUploadDocument = async (fileList: any[]) => {
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

  // 更新交付项状态
  const handleUpdateDeliveryItem = async (itemIndex: number, isCompleted: boolean) => {
    if (!id || !checklist) return

    try {
      const updatedItems = [...(checklist.delivery_items || [])]
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined
      }

      await PreparationService.updateDeliveryItems(Number(id), updatedItems)
      Message.success('更新成功')
      loadChecklistDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '更新失败')
    }
  }

  // 计算完成进度
  const calculateProgress = () => {
    if (!checklist?.delivery_items || checklist.delivery_items.length === 0) {
      return 0
    }
    const completed = checklist.delivery_items.filter(item => item.is_completed).length
    return Math.round((completed / checklist.delivery_items.length) * 100)
  }

  useEffect(() => {
    loadChecklistDetail()
  }, [id])

  if (loading) {
    return <div style={{ padding: '20px' }}>加载中...</div>
  }

  if (!checklist) {
    return <div style={{ padding: '20px' }}>交付清单不存在</div>
  }

  const statusConfig = DELIVERY_STATUS_CONFIG[checklist.status]
  const progress = calculateProgress()

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
            <>
              <PermissionGuard permission="preparation.delivery.upload">
                <Button
                  icon={<IconUpload />}
                  onClick={() => setUploadVisible(true)}
                >
                  上传文档
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="preparation.delivery.edit">
                <Button
                  type="primary"
                  icon={<IconEdit />}
                  onClick={() => navigate(`/store-preparation/delivery/${checklist.id}/edit`)}
                >
                  编辑清单
                </Button>
              </PermissionGuard>
            </>
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
              label: '交付进度',
              value: (
                <Space>
                  <Progress percent={progress} size="small" style={{ width: 100 }} />
                  <span>{progress}%</span>
                </Space>
              )
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
            <List
              dataSource={checklist.delivery_items || []}
              render={(item: DeliveryItem, index: number) => (
                <List.Item
                  key={index}
                  style={{
                    padding: '16px',
                    border: '1px solid #e5e6eb',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={item.is_completed}
                          onChange={(checked) => handleUpdateDeliveryItem(index, checked)}
                          disabled={checklist.status === 'completed'}
                        >
                          <span style={{ 
                            fontWeight: 500, 
                            textDecoration: item.is_completed ? 'line-through' : 'none',
                            color: item.is_completed ? '#86909c' : '#1d2129'
                          }}>
                            {item.name}
                          </span>
                        </Checkbox>
                      </div>
                      <Tag color={item.is_completed ? 'green' : 'gray'}>
                        {item.is_completed ? '已完成' : '待完成'}
                      </Tag>
                    </div>
                    
                    {item.description && (
                      <div style={{ fontSize: '14px', color: '#86909c', marginBottom: '8px', marginLeft: '24px' }}>
                        {item.description}
                      </div>
                    )}
                    
                    <div style={{ fontSize: '12px', color: '#86909c', marginLeft: '24px' }}>
                      <Space split="|">
                        <span>类型：{item.type || '其他'}</span>
                        {item.is_required && <span style={{ color: '#f53f3f' }}>必需项</span>}
                        {item.completed_at && (
                          <span>完成时间：{new Date(item.completed_at).toLocaleString('zh-CN')}</span>
                        )}
                      </Space>
                    </div>
                  </div>
                </List.Item>
              )}
            />
            
            {(!checklist.delivery_items || checklist.delivery_items.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#86909c' }}>
                暂无交付项
              </div>
            )}
          </TabPane>

          <TabPane key="documents" title="交付文档">
            <div>
              {checklist.documents && checklist.documents.length > 0 ? (
                <List
                  dataSource={checklist.documents}
                  render={(doc: any, index: number) => (
                    <List.Item
                      key={index}
                      actions={[
                        <Button
                          type="text"
                          icon={<IconDownload />}
                          onClick={() => window.open(doc.url)}
                        >
                          下载
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={doc.name}
                        description={
                          <Space>
                            <span>类型：{doc.type || '其他'}</span>
                            <span>大小：{doc.size ? `${Math.round(doc.size / 1024)}KB` : '-'}</span>
                            <span>上传时间：{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString('zh-CN') : '-'}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#86909c' }}>
                  暂无交付文档
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 上传文档弹窗 */}
      <Modal
        title="上传交付文档"
        visible={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        onOk={() => {
          const uploadComponent = document.querySelector('.arco-upload') as any
          if (uploadComponent) {
            uploadComponent.click()
          }
        }}
      >
        <Upload
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={(fileList) => {
            if (fileList.length > 0) {
              handleUploadDocument(fileList)
            }
          }}
        >
          <Button icon={<IconUpload />}>选择文件</Button>
        </Upload>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#86909c' }}>
          支持上传 PDF、Word、Excel、图片格式文件
        </div>
      </Modal>
    </div>
  )
}

export default DeliveryDetail