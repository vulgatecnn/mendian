import React, { useState, useCallback } from 'react'
import {
  Modal,
  Upload,
  Button,
  Progress,
  Result,
  Steps,
  Table,
  Alert,
  Typography,
  Tag,
  Card
} from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload'
import type { ColumnsType } from 'antd/es/table'

const { Dragger } = Upload
const { Step } = Steps
const { Title, Text, Paragraph } = Typography

interface ImportResult {
  success: boolean
  total: number
  successCount: number
  failCount: number
  errors: Array<{
    row: number
    field: string
    value: any
    message: string
  }>
  warnings: Array<{
    row: number
    field: string
    value: any
    message: string
  }>
}

interface ExportConfig {
  format: 'excel' | 'pdf' | 'csv'
  fields: Array<{
    key: string
    title: string
    required?: boolean
  }>
  filters?: Record<string, any>
}

export interface ImportExportProps {
  // 导入配置
  importConfig?: {
    accept: string
    maxSize: number
    templateUrl?: string
    templateFields: Array<{
      key: string
      title: string
      required: boolean
      type: 'string' | 'number' | 'date' | 'boolean'
      example?: string
    }>
    onImport: (file: File) => Promise<ImportResult>
  }
  
  // 导出配置
  exportConfig?: {
    formats: ExportConfig['format'][]
    defaultFormat: ExportConfig['format']
    onExport: (config: ExportConfig) => Promise<string> // 返回下载链接
  }
  
  // UI配置
  title?: string
  type: 'import' | 'export' | 'both'
  open: boolean
  onCancel: () => void
}

const ImportExport: React.FC<ImportExportProps> = ({
  importConfig,
  exportConfig,
  title,
  type = 'both',
  open,
  onCancel
}) => {
  // 状态管理
  const [currentStep, setCurrentStep] = useState(0)
  const [mode, setMode] = useState<'import' | 'export'>('import')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportConfig['format']>('excel')
  const [exportProgress, setExportProgress] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  
  // 重置状态
  const resetState = useCallback(() => {
    setCurrentStep(0)
    setUploading(false)
    setUploadProgress(0)
    setImportResult(null)
    setExportProgress(0)
    setExporting(false)
    setDownloadUrl('')
  }, [])
  
  // 处理模态框关闭
  const handleCancel = useCallback(() => {
    resetState()
    onCancel()
  }, [resetState, onCancel])
  
  // 文件上传配置
  const uploadProps: UploadProps = {
    accept: importConfig?.accept || '.xlsx,.xls,.csv',
    maxCount: 1,
    beforeUpload: (file) => {
      // 检查文件大小
      const maxSize = importConfig?.maxSize || 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        Modal.error({
          title: '文件大小超限',
          content: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`
        })
        return false
      }
      
      // 开始导入
      handleImport(file)
      return false // 阻止自动上传
    },
    showUploadList: false
  }
  
  // 处理导入
  const handleImport = useCallback(async (file: File) => {
    if (!importConfig) return
    
    setUploading(true)
    setCurrentStep(1)
    
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)
      
      const result = await importConfig.onImport(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setImportResult(result)
      setCurrentStep(2)
    } catch (error) {
      console.error('导入失败:', error)
      Modal.error({
        title: '导入失败',
        content: error instanceof Error ? error.message : '未知错误'
      })
      setCurrentStep(0)
    } finally {
      setUploading(false)
    }
  }, [importConfig])
  
  // 处理导出
  const handleExport = useCallback(async () => {
    if (!exportConfig) return
    
    setExporting(true)
    setCurrentStep(1)
    
    try {
      // 模拟导出进度
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)
      
      const downloadUrl = await exportConfig.onExport({
        format: exportFormat,
        fields: [], // 这里可以根据需要配置字段
        filters: {}
      })
      
      clearInterval(progressInterval)
      setExportProgress(100)
      setDownloadUrl(downloadUrl)
      setCurrentStep(2)
    } catch (error) {
      console.error('导出失败:', error)
      Modal.error({
        title: '导出失败',
        content: error instanceof Error ? error.message : '未知错误'
      })
      setCurrentStep(0)
    } finally {
      setExporting(false)
    }
  }, [exportConfig, exportFormat])
  
  // 下载模板
  const downloadTemplate = useCallback(() => {
    if (importConfig?.templateUrl) {
      const link = document.createElement('a')
      link.href = importConfig.templateUrl
      link.download = '导入模板.xlsx'
      link.click()
    }
  }, [importConfig?.templateUrl])
  
  // 下载导出文件
  const downloadExportFile = useCallback(() => {
    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `导出数据.${exportFormat}`
      link.click()
    }
  }, [downloadUrl, exportFormat])
  
  // 渲染导入错误详情
  const renderImportErrors = () => {
    if (!importResult?.errors.length) return null
    
    const columns: ColumnsType<any> = [
      {
        title: '行号',
        dataIndex: 'row',
        width: 80
      },
      {
        title: '字段',
        dataIndex: 'field',
        width: 120
      },
      {
        title: '值',
        dataIndex: 'value',
        width: 120,
        render: (value) => <Text code>{String(value)}</Text>
      },
      {
        title: '错误信息',
        dataIndex: 'message',
        render: (message) => <Text type="danger">{message}</Text>
      }
    ]
    
    return (
      <div style={{ marginTop: 16 }}>
        <Title level={5}>错误详情</Title>
        <Table
          size="small"
          dataSource={importResult.errors}
          columns={columns}
          pagination={false}
          scroll={{ y: 200 }}
        />
      </div>
    )
  }
  
  // 渲染模式选择
  const renderModeSelection = () => {
    if (type !== 'both') return null
    
    return (
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Space size="large">
          <Button
            type={mode === 'import' ? 'primary' : 'default'}
            icon={<UploadOutlined />}
            onClick={() => setMode('import')}
          >
            数据导入
          </Button>
          <Button
            type={mode === 'export' ? 'primary' : 'default'}
            icon={<DownloadOutlined />}
            onClick={() => setMode('export')}
          >
            数据导出
          </Button>
        </Space>
      </div>
    )
  }
  
  // 渲染导入界面
  const renderImportContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            {/* 模板说明 */}
            {importConfig?.templateFields && (
              <Card title="导入说明" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message="请按照模板格式准备数据"
                    description="支持 .xlsx、.xls、.csv 格式文件"
                    type="info"
                    showIcon
                  />
                  
                  <div>
                    <Title level={5}>必填字段：</Title>
                    <Space wrap>
                      {importConfig.templateFields
                        .filter(field => field.required)
                        .map(field => (
                          <Tag key={field.key} color="red">
                            {field.title}
                          </Tag>
                        ))}
                    </Space>
                  </div>
                  
                  <div>
                    <Title level={5}>可选字段：</Title>
                    <Space wrap>
                      {importConfig.templateFields
                        .filter(field => !field.required)
                        .map(field => (
                          <Tag key={field.key}>
                            {field.title}
                          </Tag>
                        ))}
                    </Space>
                  </div>
                  
                  {importConfig.templateUrl && (
                    <Button
                      type="link"
                      icon={<FileExcelOutlined />}
                      onClick={downloadTemplate}
                    >
                      下载导入模板
                    </Button>
                  )}
                </Space>
              </Card>
            )}
            
            {/* 文件上传 */}
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 Excel (.xlsx, .xls) 和 CSV 格式
              </p>
            </Dragger>
          </div>
        )
        
      case 1:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>正在处理文件...</Title>
            <Progress percent={uploadProgress} />
            <Paragraph type="secondary">
              请稍候，正在解析和验证数据
            </Paragraph>
          </div>
        )
        
      case 2:
        if (!importResult) return null
        
        return (
          <Result
            icon={importResult.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            status={importResult.success ? 'success' : 'warning'}
            title={importResult.success ? '导入完成' : '导入完成（有错误）'}
            subTitle={
              <div>
                <p>总数据量：{importResult.total}</p>
                <p>成功导入：{importResult.successCount}</p>
                {importResult.failCount > 0 && (
                  <p>失败数量：{importResult.failCount}</p>
                )}
              </div>
            }
            extra={
              <Space>
                <Button type="primary" onClick={handleCancel}>
                  完成
                </Button>
                {importResult.failCount > 0 && (
                  <Button onClick={() => setCurrentStep(0)}>
                    重新导入
                  </Button>
                )}
              </Space>
            }
          >
            {renderImportErrors()}
          </Result>
        )
        
      default:
        return null
    }
  }
  
  // 渲染导出界面
  const renderExportContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Card title="导出设置">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Title level={5}>导出格式：</Title>
                  <Space>
                    {exportConfig?.formats.map(format => (
                      <Button
                        key={format}
                        type={exportFormat === format ? 'primary' : 'default'}
                        onClick={() => setExportFormat(format)}
                        icon={
                          format === 'excel' ? <FileExcelOutlined /> :
                          format === 'pdf' ? <FilePdfOutlined /> :
                          <FileTextOutlined />
                        }
                      >
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </Space>
                </div>
                
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  loading={exporting}
                  block
                >
                  开始导出
                </Button>
              </Space>
            </Card>
          </div>
        )
        
      case 1:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>正在生成文件...</Title>
            <Progress percent={exportProgress} />
            <Paragraph type="secondary">
              请稍候，正在生成导出文件
            </Paragraph>
          </div>
        )
        
      case 2:
        return (
          <Result
            status="success"
            title="导出完成"
            subTitle="文件已生成，请下载"
            extra={
              <Space>
                <Button type="primary" onClick={downloadExportFile}>
                  下载文件
                </Button>
                <Button onClick={() => setCurrentStep(0)}>
                  重新导出
                </Button>
                <Button onClick={handleCancel}>
                  完成
                </Button>
              </Space>
            }
          />
        )
        
      default:
        return null
    }
  }
  
  // 获取步骤配置
  const steps = [
    { title: mode === 'import' ? '选择文件' : '设置参数' },
    { title: mode === 'import' ? '导入数据' : '生成文件' },
    { title: '完成' }
  ]
  
  return (
    <Modal
      title={title || `数据${mode === 'import' ? '导入' : '导出'}`}
      open={open}
      onCancel={handleCancel}
      width={800}
      footer={null}
      destroyOnClose
    >
      {renderModeSelection()}
      
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} />
        ))}
      </Steps>
      
      {(type === 'import' || mode === 'import') && renderImportContent()}
      {(type === 'export' || mode === 'export') && renderExportContent()}
    </Modal>
  )
}

export default ImportExport