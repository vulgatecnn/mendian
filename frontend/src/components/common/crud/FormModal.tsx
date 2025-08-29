import React, { useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  InputNumber,
  Upload,
  Radio,
  Checkbox,
  TreeSelect,
  Cascader,
  Row,
  Col,
  Button,
  Spin
} from 'antd'
import {
  UploadOutlined,
  InboxOutlined
} from '@ant-design/icons'
import type { FormInstance } from 'antd/es/form'
import type { UploadProps } from 'antd/es/upload'
import { useDevice } from '@/hooks/useDevice'

const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { Dragger } = Upload

export interface FormFieldOption {
  label: string
  value: string | number
  disabled?: boolean
  children?: FormFieldOption[]
}

export interface FormField {
  name: string | string[]
  label: string
  type: 'input' | 'textarea' | 'select' | 'multiselect' | 'date' | 'dateRange' | 
        'switch' | 'number' | 'radio' | 'checkbox' | 'upload' | 'dragger' |
        'treeSelect' | 'cascader' | 'password' | 'email' | 'phone' | 'url'
  
  // 通用属性
  required?: boolean
  disabled?: boolean
  placeholder?: string
  tooltip?: string
  extra?: string
  span?: number
  
  // 规则验证
  rules?: any[]
  
  // 选项配置
  options?: FormFieldOption[]
  
  // 上传配置
  uploadProps?: UploadProps & {
    maxCount?: number
    accept?: string
    listType?: 'text' | 'picture' | 'picture-card'
  }
  
  // 数字输入配置
  min?: number
  max?: number
  step?: number
  precision?: number
  
  // 文本配置
  maxLength?: number
  minLength?: number
  
  // 选择器配置
  mode?: 'multiple' | 'tags'
  allowClear?: boolean
  showSearch?: boolean
  filterOption?: boolean | ((inputValue: string, option: any) => boolean)
  
  // 日期配置
  format?: string
  showTime?: boolean
  
  // 依赖关系
  dependencies?: string[]
  
  // 自定义渲染
  render?: (form: FormInstance, field: FormField) => React.ReactNode
  
  // 动态显示
  visible?: boolean | ((values: any) => boolean)
}

export interface FormSection {
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface FormModalProps {
  // 基本属性
  title: string
  open: boolean
  onCancel: () => void
  onOk: (values: any) => Promise<void> | void
  
  // 表单配置
  fields?: FormField[]
  sections?: FormSection[]
  initialValues?: Record<string, any>
  
  // 样式配置
  width?: number | string
  centered?: boolean
  destroyOnClose?: boolean
  maskClosable?: boolean
  
  // 状态
  loading?: boolean
  confirmLoading?: boolean
  
  // 表单配置
  layout?: 'horizontal' | 'vertical' | 'inline'
  labelCol?: any
  wrapperCol?: any
  
  // 权限
  readOnly?: boolean
  
  // 额外配置
  footer?: React.ReactNode | null
  extra?: React.ReactNode
  
  // 回调
  onValuesChange?: (changedValues: any, allValues: any) => void
  onFieldsChange?: (changedFields: any, allFields: any) => void
}

export interface FormModalRef {
  form: FormInstance
  submit: () => Promise<void>
  reset: () => void
  setFieldsValue: (values: any) => void
  getFieldsValue: () => any
}

const FormModal = forwardRef<FormModalRef, FormModalProps>(({
  title,
  open,
  onCancel,
  onOk,
  fields = [],
  sections = [],
  initialValues,
  width = 600,
  centered = true,
  destroyOnClose = true,
  maskClosable = false,
  loading = false,
  confirmLoading = false,
  layout = 'vertical',
  labelCol,
  wrapperCol,
  readOnly = false,
  footer,
  extra: _extra,
  onValuesChange,
  onFieldsChange
}, ref) => {
  const { isMobile } = useDevice()
  const [form] = Form.useForm()
  
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    form,
    submit: async () => {
      const values = await form.validateFields()
      await onOk(values)
    },
    reset: () => form.resetFields(),
    setFieldsValue: (values) => form.setFieldsValue(values),
    getFieldsValue: () => form.getFieldsValue()
  }), [form, onOk])
  
  // 初始化表单值
  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [open, initialValues, form])
  
  // 提交处理
  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields()
      await onOk(values)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }, [form, onOk])
  
  // 渲染表单字段
  const renderField = useCallback((field: FormField, formValues: any = {}) => {
    // 检查字段可见性
    if (field.visible === false) return null
    if (typeof field.visible === 'function' && !field.visible(formValues)) {
      return null
    }
    
    // 自定义渲染
    if (field.render) {
      return field.render(form, field)
    }
    
    const commonProps = {
      placeholder: field.placeholder,
      disabled: field.disabled || readOnly,
      maxLength: field.maxLength
    }
    
    switch (field.type) {
      case 'input':
        return <Input {...commonProps} />
        
      case 'textarea':
        return (
          <TextArea 
            {...commonProps}
            rows={4}
            maxLength={field.maxLength}
            showCount={!!field.maxLength}
          />
        )
        
      case 'password':
        return <Input.Password {...commonProps} />
        
      case 'email':
        return <Input {...commonProps} type="email" />
        
      case 'phone':
        return <Input {...commonProps} />
        
      case 'url':
        return <Input {...commonProps} type="url" />
        
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            min={field.min}
            max={field.max}
            step={field.step}
            precision={field.precision}
            style={{ width: '100%' }}
          />
        )
        
      case 'select':
        return (
          <Select
            {...commonProps}
            allowClear={field.allowClear}
            showSearch={field.showSearch}
            filterOption={field.filterOption}
          >
            {field.options?.map(option => (
              <Option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </Option>
            ))}
          </Select>
        )
        
      case 'multiselect':
        return (
          <Select
            {...commonProps}
            mode={field.mode || 'multiple'}
            allowClear={field.allowClear}
            showSearch={field.showSearch}
            filterOption={field.filterOption}
          >
            {field.options?.map(option => (
              <Option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </Option>
            ))}
          </Select>
        )
        
      case 'date':
        return (
          <DatePicker
            {...commonProps}
            style={{ width: '100%' }}
            format={field.format}
            showTime={field.showTime}
          />
        )
        
      case 'dateRange':
        return (
          <RangePicker
            placeholder={[field.placeholder || '开始日期', '结束日期']}
            disabled={field.disabled || readOnly}
            maxLength={field.maxLength}
            style={{ width: '100%' }}
            format={field.format}
            showTime={field.showTime}
          />
        )
        
      case 'switch':
        return (
          <Switch
            disabled={field.disabled || readOnly}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        )
        
      case 'radio':
        return (
          <Radio.Group disabled={field.disabled || readOnly}>
            {field.options?.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        )
        
      case 'checkbox':
        return (
          <Checkbox.Group 
            options={field.options?.map(opt => ({
              label: opt.label,
              value: opt.value,
              disabled: opt.disabled
            }))}
            disabled={field.disabled || readOnly}
          />
        )
        
      case 'treeSelect':
        return (
          <TreeSelect
            {...commonProps}
            treeData={field.options}
            allowClear={field.allowClear}
            showSearch={field.showSearch}
            multiple={field.mode === 'multiple'}
          />
        )
        
      case 'cascader':
        return (
          <Cascader
            {...commonProps}
            options={field.options}
            allowClear={field.allowClear}
            showSearch={field.showSearch}
            multiple={field.mode === 'multiple'}
          />
        )
        
      case 'upload':
        return (
          <Upload
            {...field.uploadProps}
            disabled={field.disabled || readOnly}
          >
            <Button icon={<UploadOutlined />}>
              上传文件
            </Button>
          </Upload>
        )
        
      case 'dragger':
        return (
          <Dragger
            {...field.uploadProps}
            disabled={field.disabled || readOnly}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              {field.uploadProps?.accept && `支持格式: ${field.uploadProps.accept}`}
            </p>
          </Dragger>
        )
        
      default:
        return <Input {...commonProps} />
    }
  }, [form, readOnly])
  
  // 渲染表单项
  const renderFormItem = useCallback((field: FormField, formValues: any = {}) => {
    const rules = [
      ...(field.required ? [{ required: true, message: `请输入${field.label}` }] : []),
      ...(field.rules || [])
    ]
    
    return (
      <Col key={Array.isArray(field.name) ? field.name.join('.') : field.name} span={field.span || (isMobile ? 24 : 12)}>
        <Form.Item
          name={field.name}
          label={field.label}
          rules={rules}
          tooltip={field.tooltip}
          extra={field.extra}
          dependencies={field.dependencies}
          valuePropName={field.type === 'switch' ? 'checked' : 'value'}
        >
          {renderField(field, formValues)}
        </Form.Item>
      </Col>
    )
  }, [isMobile, renderField])
  
  // 获取所有字段
  const allFields = useMemo(() => {
    if (sections.length > 0) {
      return sections.flatMap(section => section.fields)
    }
    return fields
  }, [fields, sections])
  
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      width={isMobile ? '95vw' : width}
      centered={centered}
      destroyOnClose={destroyOnClose}
      maskClosable={maskClosable}
      confirmLoading={confirmLoading}
      footer={footer}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout={layout}
          labelCol={labelCol}
          wrapperCol={wrapperCol}
          initialValues={initialValues}
          onValuesChange={onValuesChange}
          onFieldsChange={onFieldsChange}
          scrollToFirstError
          preserve={false}
        >
          {sections.length > 0 ? (
            sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h4>{section.title}</h4>
                {section.description && <p style={{ color: '#666' }}>{section.description}</p>}
                <Row gutter={16}>
                  <Form.Item dependencies={allFields.map(f => Array.isArray(f.name) ? f.name : [f.name]).flat()}>
                    {({ getFieldsValue }) => {
                      const formValues = getFieldsValue()
                      return section.fields.map(field => renderFormItem(field, formValues))
                    }}
                  </Form.Item>
                </Row>
              </div>
            ))
          ) : (
            <Row gutter={16}>
              <Form.Item dependencies={allFields.map(f => Array.isArray(f.name) ? f.name : [f.name]).flat()}>
                {({ getFieldsValue }) => {
                  const formValues = getFieldsValue()
                  return fields.map(field => renderFormItem(field, formValues))
                }}
              </Form.Item>
            </Row>
          )}
        </Form>
      </Spin>
    </Modal>
  )
})

FormModal.displayName = 'FormModal'

export default FormModal