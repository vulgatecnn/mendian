/**
 * 导入模板管理页面
 */
import React from 'react'
import {
  Card,
  Button,
  Message,
  Typography,
  Divider,
  Space,
  List,
  Tag
} from '@arco-design/web-react'
import { IconDownload, IconFile } from '@arco-design/web-react/icon'
import { useImportExportService } from '../../api/importExportService'
import styles from './TemplateManagement.module.css'

const { Title, Paragraph, Text } = Typography

/**
 * 模板信息接口
 */
interface TemplateInfo {
  name: string
  description: string
  fields: Array<{
    name: string
    required: boolean
    type: string
    description: string
    example?: string
  }>
}

/**
 * 模板信息数据
 */
const templateInfo: TemplateInfo = {
  name: '开店计划导入模板',
  description: '用于批量导入开店计划数据的 Excel 模板',
  fields: [
    {
      name: '计划名称',
      required: true,
      type: '文本',
      description: '开店计划的名称',
      example: '2024年华东区开店计划'
    },
    {
      name: '计划类型',
      required: true,
      type: '文本',
      description: '计划类型：annual（年度）或 quarterly（季度）',
      example: 'annual'
    },
    {
      name: '开始日期',
      required: true,
      type: '日期',
      description: '计划开始日期，格式：YYYY-MM-DD',
      example: '2024-01-01'
    },
    {
      name: '结束日期',
      required: true,
      type: '日期',
      description: '计划结束日期，格式：YYYY-MM-DD',
      example: '2024-12-31'
    },
    {
      name: '计划描述',
      required: false,
      type: '文本',
      description: '计划的详细描述',
      example: '2024年华东区域开店计划'
    },
    {
      name: '经营区域',
      required: true,
      type: '文本',
      description: '经营区域名称或编码',
      example: '华东区'
    },
    {
      name: '门店类型',
      required: true,
      type: '文本',
      description: '门店类型名称或编码',
      example: '直营店'
    },
    {
      name: '目标数量',
      required: true,
      type: '数字',
      description: '计划开店数量，必须为正整数',
      example: '50'
    },
    {
      name: '贡献率',
      required: true,
      type: '数字',
      description: '预期贡献率，范围 0-100',
      example: '30.5'
    },
    {
      name: '预算金额',
      required: false,
      type: '数字',
      description: '预算金额（元）',
      example: '5000000'
    }
  ]
}

/**
 * 模板管理页面组件
 */
const TemplateManagement: React.FC = () => {
  const { loading, downloadTemplate } = useImportExportService()

  /**
   * 下载模板
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

  return (
    <div className={styles.container}>
      <Card>
        <Title heading={4}>导入模板管理</Title>
        <Paragraph>
          下载和查看开店计划数据导入模板的详细说明。
        </Paragraph>

        <Divider />

        {/* 模板下载区域 */}
        <div className={styles.downloadSection}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className={styles.templateCard}>
              <div className={styles.templateIcon}>
                <IconFile style={{ fontSize: 48, color: '#00b42a' }} />
              </div>
              <div className={styles.templateInfo}>
                <Title heading={6}>{templateInfo.name}</Title>
                <Text type="secondary">{templateInfo.description}</Text>
              </div>
              <div className={styles.templateAction}>
                <Button
                  type="primary"
                  icon={<IconDownload />}
                  onClick={handleDownloadTemplate}
                  loading={loading}
                  size="large"
                >
                  下载模板
                </Button>
              </div>
            </div>
          </Space>
        </div>

        <Divider />

        {/* 模板字段说明 */}
        <div className={styles.fieldsSection}>
          <Title heading={5}>模板字段说明</Title>
          <Paragraph type="secondary">
            以下是模板中各字段的详细说明，请严格按照要求填写数据。
          </Paragraph>

          <List
            className={styles.fieldsList}
            dataSource={templateInfo.fields}
            render={(field, index) => (
              <List.Item key={index}>
                <div className={styles.fieldItem}>
                  <div className={styles.fieldHeader}>
                    <Space>
                      <Text style={{ fontWeight: 'bold' }}>{field.name}</Text>
                      {field.required ? (
                        <Tag color="red" size="small">必填</Tag>
                      ) : (
                        <Tag color="gray" size="small">可选</Tag>
                      )}
                      <Tag color="blue" size="small">{field.type}</Tag>
                    </Space>
                  </div>
                  <div className={styles.fieldDescription}>
                    <Text type="secondary">{field.description}</Text>
                  </div>
                  {field.example && (
                    <div className={styles.fieldExample}>
                      <Text type="secondary">示例：</Text>
                      <Text code>{field.example}</Text>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        </div>

        <Divider />

        {/* 使用说明 */}
        <div className={styles.instructionsSection}>
          <Title heading={5}>使用说明</Title>
          
          <div className={styles.instruction}>
            <Title heading={6}>1. 下载模板</Title>
            <Paragraph>
              点击上方"下载模板"按钮，下载 Excel 格式的导入模板文件。
            </Paragraph>
          </div>

          <div className={styles.instruction}>
            <Title heading={6}>2. 填写数据</Title>
            <Paragraph>
              在模板中按照字段说明填写数据：
            </Paragraph>
            <ul>
              <li>必填字段不能为空</li>
              <li>日期格式必须为 YYYY-MM-DD</li>
              <li>数字字段不能包含非数字字符</li>
              <li>贡献率范围为 0-100</li>
              <li>目标数量必须为正整数</li>
            </ul>
          </div>

          <div className={styles.instruction}>
            <Title heading={6}>3. 上传导入</Title>
            <Paragraph>
              填写完成后，在"数据导入"页面上传文件进行导入。系统会自动验证数据格式，
              如有错误会显示详细的错误信息。
            </Paragraph>
          </div>

          <div className={styles.instruction}>
            <Title heading={6}>4. 注意事项</Title>
            <ul>
              <li>请勿修改模板的表头和列顺序</li>
              <li>同一个计划可以包含多个区域计划，在不同行填写即可</li>
              <li>经营区域和门店类型必须在系统中已存在</li>
              <li>文件大小不能超过 10MB</li>
              <li>建议先导入少量数据测试，确认无误后再批量导入</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TemplateManagement
