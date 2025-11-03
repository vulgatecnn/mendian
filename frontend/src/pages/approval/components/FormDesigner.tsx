/**
 * 表单设计器组件
 */
import React, { useState } from 'react'
import {
  Button,
  Space,
  Form,
  Input,
  Select,
  Switch,
  Modal,
  Table,
  Message,
} from '@arco-design/web-react'
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconUp,
  IconDown,
} from '@arco-design/web-react/icon'

const FormItem = Form.Item

interface FormField {
  name: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'number' | 'date' | 'radio' | 'checkbox'
  required: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  defaultValue?: any
}

interface FormDesignerProps {
  value?: { fields: FormField[] }
  onChange?: (value: { fields: FormField[] }) => void
}

const FormDesigner: React.FC<FormDesignerProps> = ({ value, onChange }) => {
  const [fields, setFields] = useState<FormField[]>(value?.fields || [])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [form] = Form.useForm()

  const handleAddField = () => {
    setEditingField(null)
    setEditingIndex(-1)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditField = (field: FormField, index: number) => {
    setEditingField(field)
    setEditingIndex(index)
    form.setFieldsValue(field)
    setModalVisible(true)
  }

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    setFields(newFields)
    onChange?.({ fields: newFields })
    Message.success('字段删除成功')
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newFields = [...fields]
    ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
    setFields(newFields)
    onChange?.({ fields: newFields })
  }

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return
    const newFields = [...fields]
    ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
    setFields(newFields)
    onChange?.({ fields: newFields })
  }

  const handleSaveField = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()

      const field: FormField = {
        name: values.name,
        label: values.label,
        type: values.type,
        required: values.required || false,
        placeholder: values.placeholder,
        options: values.options,
        defaultValue: values.defaultValue,
      }

      let newFields: FormField[]
      if (editingIndex >= 0) {
        newFields = [...fields]
        newFields[editingIndex] = field
        Message.success('字段更新成功')
      } else {
        newFields = [...fields, field]
        Message.success('字段添加成功')
      }

      setFields(newFields)
      onChange?.({ fields: newFields })
      setModalVisible(false)
    } catch (error) {
      // 验证失败
    }
  }

  const columns = [
    {
      title: '字段名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '字段标签',
      dataIndex: 'label',
      width: 150,
    },
    {
      title: '字段类型',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          input: '单行文本',
          textarea: '多行文本',
          select: '下拉选择',
          number: '数字',
          date: '日期',
          radio: '单选',
          checkbox: '多选',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      width: 80,
      render: (required: boolean) => (required ? '是' : '否'),
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: FormField, index: number) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconUp />}
            onClick={() => handleMoveUp(index)}
            disabled={index === 0}
          />
          <Button
            type="text"
            size="small"
            icon={<IconDown />}
            onClick={() => handleMoveDown(index)}
            disabled={index === fields.length - 1}
          />
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEditField(record, index)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDeleteField(index)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={handleAddField}
        >
          添加字段
        </Button>
      </div>

      <Table
        columns={columns}
        data={fields}
        pagination={false}
        rowKey="name"
      />

      <Modal
        title={editingIndex >= 0 ? '编辑字段' : '添加字段'}
        visible={modalVisible}
        onOk={handleSaveField}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="字段名称"
            field="name"
            rules={[
              { required: true, message: '请输入字段名称' },
              {
                validator: (value, callback) => {
                  if (editingIndex >= 0 && value === editingField?.name) {
                    callback()
                    return
                  }
                  if (fields.some((f) => f.name === value)) {
                    callback('字段名称已存在')
                  } else {
                    callback()
                  }
                },
              },
            ]}
          >
            <Input
              placeholder="请输入字段名称（英文）"
              disabled={editingIndex >= 0}
            />
          </FormItem>

          <FormItem
            label="字段标签"
            field="label"
            rules={[{ required: true, message: '请输入字段标签' }]}
          >
            <Input placeholder="请输入字段标签（中文）" />
          </FormItem>

          <FormItem
            label="字段类型"
            field="type"
            rules={[{ required: true, message: '请选择字段类型' }]}
          >
            <Select placeholder="请选择字段类型">
              <Select.Option value="input">单行文本</Select.Option>
              <Select.Option value="textarea">多行文本</Select.Option>
              <Select.Option value="select">下拉选择</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="date">日期</Select.Option>
              <Select.Option value="radio">单选</Select.Option>
              <Select.Option value="checkbox">多选</Select.Option>
            </Select>
          </FormItem>

          <FormItem label="必填" field="required">
            <Switch />
          </FormItem>

          <FormItem label="占位符" field="placeholder">
            <Input placeholder="请输入占位符" />
          </FormItem>

          <Form.Item noStyle shouldUpdate>
            {(values) => {
              const type = values.type
              if (type === 'select' || type === 'radio' || type === 'checkbox') {
                return (
                  <FormItem
                    label="选项配置"
                    field="options"
                    rules={[{ required: true, message: '请配置选项' }]}
                  >
                    <Input.TextArea
                      placeholder="请输入选项，每行一个，格式：标签:值"
                      rows={4}
                    />
                  </FormItem>
                )
              }
              return null
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FormDesigner
