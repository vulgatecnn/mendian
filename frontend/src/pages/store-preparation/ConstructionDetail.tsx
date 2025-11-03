/**
 * 工程单详情页面
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
  Timeline,
  Modal,
  Upload,
  Image
} from '@arco-design/web-react'
import {
  IconLeft,
  IconUpload,
  IconDownload
} from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import { PreparationService } from '../../api'
import {
  ConstructionOrder,
  ConstructionStatus
} from '../../types'
import { PermissionGuard } from '../../components/PermissionGuard'
import MilestoneManager from './MilestoneManager'
import AcceptanceForm from './AcceptanceForm'

const { Title } = Typography
const TabPane = Tabs.TabPane

// 工程状态配置
const CONSTRUCTION_STATUS_CONFIG: Record<ConstructionStatus, { text: string; color: string }> = {
  planning: { text: '规划中', color: 'blue' },
  in_progress: { text: '施工中', color: 'orange' },
  acceptance: { text: '验收中', color: 'purple' },
  rectification: { text: '整改中', color: 'red' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'gray' }
}

const ConstructionDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<ConstructionOrder | null>(null)
  const [acceptanceVisible, setAcceptanceVisible] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(false)

  // 加载工程单详情
  const loadOrderDetail = async () => {
    if (!id) return

    try {
      const response = await PreparationService.getConstructionOrderDetail(Number(id))
      setOrder(response)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载工程单详情失败')
    }
  }

  // 上传设计图纸
  const handleUploadDesign = async (fileList: any[]) => {
    if (!id) return

    try {
      const formData = new FormData()
      fileList.forEach(file => {
        formData.append('files', file.originFile)
      })

      await PreparationService.uploadDesignFiles(Number(id), formData)
      Message.success('上传设计图纸成功')
      setUploadVisible(false)
      loadOrderDetail()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '上传失败')
    }
  }

  // 验收成功回调
  const handleAcceptanceSuccess = () => {
    setAcceptanceVisible(false)
    loadOrderDetail()
  }

  // 里程碑更新回调
  const handleMilestoneUpdate = () => {
    loadOrderDetail()
  }

  useEffect(() => {
    loadOrderDetail()
  }, [id])

  if (!order) {
    return <div style={{ padding: '20px' }}>加载中...</div>
  }

  const statusConfig = CONSTRUCTION_STATUS_CONFIG[order.status]

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题和操作按钮 */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<IconLeft />} onClick={() => navigate('/store-preparation/construction')}>
            返回
          </Button>
          <Title heading={3} style={{ margin: 0 }}>
            工程单详情 - {order.order_no}
          </Title>
          <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
        </Space>
        <Space>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <>
              <PermissionGuard permission="preparation.construction.upload">
                <Button
                  icon={<IconUpload />}
                  onClick={() => setUploadVisible(true)}
                >
                  上传图纸
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="preparation.construction.acceptance">
                <Button
                  type="primary"
                  onClick={() => setAcceptanceVisible(true)}
                >
                  执行验收
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
              label: '工程单号',
              value: order.order_no
            },
            {
              label: '门店名称',
              value: order.store_name
            },
            {
              label: '工程状态',
              value: <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            },
            {
              label: '施工供应商',
              value: order.supplier?.name || '-'
            },
            {
              label: '开工日期',
              value: order.construction_start_date || '-'
            },
            {
              label: '预计完工日期',
              value: order.construction_end_date || '-'
            },
            {
              label: '实际完工日期',
              value: order.actual_end_date || '-'
            },
            {
              label: '验收日期',
              value: order.acceptance_date || '-'
            },
            {
              label: '验收结果',
              value: order.acceptance_result ? (
                <Tag color={order.acceptance_result === 'passed' ? 'green' : 'red'}>
                  {order.acceptance_result === 'passed' ? '通过' : order.acceptance_result === 'failed' ? '不通过' : '有条件通过'}
                </Tag>
              ) : '-'
            },
            {
              label: '创建人',
              value: order.created_by_info?.full_name || '-'
            },
            {
              label: '创建时间',
              value: order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '-'
            }
          ]}
        />
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs defaultActiveTab="milestones">
          <TabPane key="milestones" title="工程里程碑">
            <MilestoneManager
              constructionOrderId={order.id}
              milestones={order.milestones || []}
              onUpdate={handleMilestoneUpdate}
              readonly={order.status === 'completed' || order.status === 'cancelled'}
            />
          </TabPane>

          <TabPane key="design" title="设计图纸">
            <div>
              {order.design_files && order.design_files.length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {order.design_files.map((file, index) => (
                      <div key={index} style={{ textAlign: 'center' }}>
                        {file.type.startsWith('image/') ? (
                          <Image
                            src={file.url}
                            width={200}
                            height={150}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: 200, height: 150, border: '1px solid #e5e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Button
                              icon={<IconDownload />}
                              onClick={() => window.open(file.url)}
                            >
                              下载文件
                            </Button>
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>{file.name}</div>
                      </div>
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#86909c' }}>
                  暂无设计图纸
                </div>
              )}
            </div>
          </TabPane>

          <TabPane key="rectification" title="整改项">
            <div>
              {order.rectification_items && order.rectification_items.length > 0 ? (
                <Timeline>
                  {order.rectification_items.map((item, index) => (
                    <Timeline.Item
                      key={index}
                      label={item.deadline || ''}
                      dot={
                        <Tag color={item.status === 'completed' ? 'green' : item.status === 'in_progress' ? 'blue' : 'gray'}>
                          {item.status === 'completed' ? '已完成' : item.status === 'in_progress' ? '进行中' : '待处理'}
                        </Tag>
                      }
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.description}</div>
                        <div style={{ fontSize: '12px', color: '#86909c', marginTop: '4px' }}>
                          责任人：{item.responsible_person}
                        </div>
                        {item.remarks && (
                          <div style={{ fontSize: '12px', color: '#86909c', marginTop: '4px' }}>
                            备注：{item.remarks}
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#86909c' }}>
                  暂无整改项
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 验收表单弹窗 */}
      <Modal
        title="执行验收"
        visible={acceptanceVisible}
        onCancel={() => setAcceptanceVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <AcceptanceForm
          constructionOrderId={order.id}
          onSuccess={handleAcceptanceSuccess}
          onCancel={() => setAcceptanceVisible(false)}
        />
      </Modal>

      {/* 上传图纸弹窗 */}
      <Modal
        title="上传设计图纸"
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
          accept="image/*,.pdf,.dwg"
          onChange={(fileList) => {
            if (fileList.length > 0) {
              handleUploadDesign(fileList)
            }
          }}
        >
          <Button icon={<IconUpload />}>选择文件</Button>
        </Upload>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#86909c' }}>
          支持上传图片、PDF、DWG 格式文件
        </div>
      </Modal>
    </div>
  )
}

export default ConstructionDetail
