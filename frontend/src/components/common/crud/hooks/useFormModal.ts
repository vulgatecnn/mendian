import { useState, useCallback, useRef } from 'react'
import { Form, message } from 'antd'
import type { UseFormModalOptions, UseFormModalReturn } from './types'

/**
 * 表单弹窗Hook - 处理表单弹窗的状态管理和提交逻辑
 */
export function useFormModal<T = any>(
  options: UseFormModalOptions<T>
): UseFormModalReturn<T> {
  const {
    createService,
    updateService,
    onSuccess,
    onError,
    afterSubmit
  } = options

  const [form] = Form.useForm()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<T | null>(null)
  const [mode, setMode] = useState<'create' | 'edit'>('create')

  // 打开创建弹窗
  const openCreate = useCallback(() => {
    setMode('create')
    setEditingRecord(null)
    setVisible(true)
    form.resetFields()
  }, [form])

  // 打开编辑弹窗
  const openEdit = useCallback((record: T) => {
    setMode('edit')
    setEditingRecord(record)
    setVisible(true)
    form.setFieldsValue(record)
  }, [form])

  // 关闭弹窗
  const close = useCallback(() => {
    setVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }, [form])

  // 提交表单
  const handleSubmit = useCallback(async (values: any) => {
    try {
      setLoading(true)
      let response

      if (mode === 'create') {
        response = await createService?.(values)
      } else {
        const recordKey = (editingRecord as any)?.id || (editingRecord as any)?.key
        response = await updateService?.(recordKey, values)
      }

      if (response?.success) {
        message.success(mode === 'create' ? '创建成功' : '更新成功')
        close()
        onSuccess?.(response.data, mode)
        afterSubmit?.()
      } else {
        throw new Error(response?.message || '操作失败')
      }
    } catch (error) {
      console.error('表单提交失败:', error)
      const errorMsg = error instanceof Error ? error.message : '操作失败'
      message.error(errorMsg)
      onError?.(error as Error)
    } finally {
      setLoading(false)
    }
  }, [mode, editingRecord, createService, updateService, close, onSuccess, onError, afterSubmit])

  return {
    form,
    visible,
    loading,
    mode,
    editingRecord,
    openCreate,
    openEdit,
    close,
    handleSubmit
  }
}