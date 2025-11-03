/**
 * 开店计划数据导入页面
 */
import React, { useState } from 'react'
import {
  Card,
  Upload,
  Button,
  Message,
  Progress,
  Alert,
  Table,
  Space,
  Typography,
  Divider,
  Result
} from '@arco-design/web-react'
import { IconUpload, IconDownload, IconRefresh } from '@arco-design/web-react/icon'
import { useImportExportService } from '../../api/importExportService'
import { ImportResult } from '../../types'
import styles from './PlanImport.module.css'

const { Title, Paragraph, Text } = Typography

/**
 * 数据导入页面组件
 */
const PlanImport: React.FC = () => {
  const {
    loading,
    uploadProgress,
    importPlans,
    downloadTemplate,
    validateFile,
    resetProgress
  } = useImportExportService()

  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [fileList, setFileList] = useState<any[]>([])

  /**
   * 处理文件上传前的验证
   */
  const handleBeforeUpload = (file: File): boolean => {
    const validation = validateFile(file)
    
    if (!validation.valid) {
      Message.error(validation.message || '文件验证失败')
      return false
    }

    return true
  }

  /**
   * 处理文件上传
   */
  const handleUpload = async (file: File) => {
    // 重置之前的结果
    setImportResult(null)
    resetProgress()

    await importPlans(file, {
      onSuccess: (data: ImportResult) => {
        if (data.success) {
          Message.success(`导入成功！共导入 ${data.created} 条数据`)
        } else {
          Message.warning(`导入完成，但有 ${data.failed} 条数据失败`)
        }
        setImportResult(data)
      },
      onError: (error) => {
        Message.error(`导入失败：${error.message}`)
      }
    })

    // 清空文件列表
    setFileList([])
    
    return false // 阻止默认上传行为
  }

  /**
   * 下载导入模板
   */
  const handleDownloadTemplate = async () => {
    await downloadTemplate(undefined, {
      onSuccess: () => {
        Message.success('模板下载成功')
      },
      onError: (error) => {
        Message.error(`模板下载失败：${error.message}`)
      }
    })
  }

  /**
   * 重新导入
   */
  const handleReset = () => {
    setImportResult(null)
    setFileList([])
    resetProgress()
  }

  /**
   * 错误信息表格列定义
   */
  const errorColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      width: 80
    },
    {
      title: '字段',
      dataIndex: 'field',
      width: 120,
      render: (field: string) => field || '-'
    },
    {
      title: '错误信息',
      dataIndex: 'message'
    }
  ]

  return (
    <div className={styles.container}>
      <Card>
        <Title heading={4}>数据导入</Title>
        <Paragraph>
          通过 Excel 文件批量导入开店计划数据。请先下载导入模板，按照模板格式填写数据后上传。
        </Paragraph>

        <Divider />

        {/* 导入说明 */}
        <Alert
          type="info"
          content={
            <div>
              <div><strong>导入说明：</strong></div>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>支持 .xlsx 和 .xls 格式的 Excel 文件</li>
                <li>文件大小不能超过 10MB</li>
                <li>请严格按照模板格式填写数据</li>
                <li>必填字段不能为空</li>
                <li>日期格式为 YYYY-MM-DD</li>
                <li>贡献率范围为 0-100</li>
              </ul>
            </div>
          }
          style={{ marginBottom: 24 }}
        />

        {/* 下载模板按钮 */}
        <div style={{ marginBottom: 24 }}>
          <Button
            type="outline"
            icon={<IconDownload />}
            onClick={handleDownloadTemplate}
            loading={loading && !uploadProgress.percentage}
          >
            下载导入模板
          </Button>
        </div>

        <Divider />

        {/* 文件上传区域 */}
        {!importResult && (
          <div className={styles.uploadArea}>
            <Upload
              drag
              accept=".xlsx,.xls"
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              customRequest={(options) => {
                handleUpload(options.file as File)
              }}
              onChange={(fileList) => {
                setFileList(fileList)
              }}
              disabled={loading}
            >
              <div className={styles.uploadContent}>
                <IconUpload style={{ fontSize: 48, color: '#3370ff' }} />
                <div style={{ marginTop: 16 }}>
                  <Text>点击或拖拽文件到此区域上传</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    支持 .xlsx 和 .xls 格式，文件大小不超过 10MB
                  </Text>
                </div>
              </div>
            </Upload>

            {/* 上传进度 */}
            {loading && uploadProgress.percentage > 0 && (
              <div style={{ marginTop: 24 }}>
                <Progress
                  percent={uploadProgress.percentage}
                  status={uploadProgress.percentage === 100 ? 'success' : 'normal'}
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                  正在上传... {uploadProgress.percentage}%
                </Text>
              </div>
            )}

            {/* 处理中提示 */}
            {loading && uploadProgress.percentage === 100 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text>正在处理数据，请稍候...</Text>
              </div>
            )}
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <div className={styles.resultArea}>
            <Result
              status={importResult.success ? 'success' : 'warning'}
              title={importResult.message}
              subTitle={
                <Space direction="vertical" size="small">
                  <Text>总计：{importResult.total} 条</Text>
                  <Text type="success">成功：{importResult.created} 条</Text>
                  {importResult.updated > 0 && (
                    <Text type="warning">更新：{importResult.updated} 条</Text>
                  )}
                  {importResult.failed > 0 && (
                    <Text type="error">失败：{importResult.failed} 条</Text>
                  )}
                </Space>
              }
              extra={
                <Space>
                  <Button type="primary" icon={<IconRefresh />} onClick={handleReset}>
                    继续导入
                  </Button>
                </Space>
              }
            />

            {/* 错误详情 */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title heading={6}>错误详情</Title>
                <Table
                  columns={errorColumns}
                  data={importResult.errors}
                  pagination={false}
                  scroll={{ y: 300 }}
                  size="small"
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default PlanImport
