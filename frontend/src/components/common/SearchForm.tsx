/**
 * 搜索表单组件 - 统一的查询表单界面
 */

import React, { useState } from 'react'
import { Form, Row, Col, Button, Space, Card, Grid } from 'antd'
import { DownOutlined, UpOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { FormProps } from 'antd'

const { useBreakpoint } = Grid

interface SearchFormProps extends Omit<FormProps, 'onFinish' | 'children'> {
  /** 表单项渲染函数 */
  children: React.ReactNode | ((collapsed: boolean) => React.ReactNode)
  /** 搜索回调 */
  onSearch?: (values: any) => void
  /** 重置回调 */
  onReset?: () => void
  /** 默认是否展开 */
  defaultExpanded?: boolean
  /** 是否支持展开/收起 */
  collapsible?: boolean
  /** 收起时显示的项目数量 */
  collapseCount?: number
  /** 是否显示重置按钮 */
  showReset?: boolean
  /** 额外的操作按钮 */
  extra?: React.ReactNode
}

const SearchForm: React.FC<SearchFormProps> = ({
  children,
  onSearch,
  onReset,
  defaultExpanded = false,
  collapsible = true,
  collapseCount: _collapseCount = 3,
  showReset = true,
  extra,
  ...formProps
}) => {
  const [form] = Form.useForm()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  // 处理搜索
  const handleSearch = () => {
    form.validateFields().then((values) => {
      onSearch?.(values)
    })
  }

  // 处理重置
  const handleReset = () => {
    form.resetFields()
    onReset?.()
  }

  // 获取栅格配置
  // const getColConfig = () => {
  //   if (isMobile) {
  //     return { xs: 24 }
  //   }
  //   return { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 }
  // }

  return (
    <Card
      bordered={false}
      size="small"
      style={{
        marginBottom: 16,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)'
      }}
      bodyStyle={{ paddingBottom: 0 }}
    >
      <Form
        form={form}
        layout={isMobile ? 'vertical' : 'horizontal'}
        {...formProps}
      >
        <Row gutter={[16, 16]}>
          {/* 表单项 */}
          <Col span={24}>
            <Row gutter={[16, 16]}>
              {typeof children === 'function' ? children(expanded) : children}
            </Row>
          </Col>

          {/* 操作按钮 */}
          <Col span={24}>
            <Row justify="end" style={{ paddingBottom: 16 }}>
              <Space size="middle">
                {extra}
                
                {showReset && (
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                )}
                
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  查询
                </Button>
                
                {collapsible && !isMobile && (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <>
                        收起 <UpOutlined />
                      </>
                    ) : (
                      <>
                        展开 <DownOutlined />
                      </>
                    )}
                  </Button>
                )}
              </Space>
            </Row>
          </Col>
        </Row>
      </Form>
    </Card>
  )
}

// 搜索项包装组件
interface SearchItemProps {
  /** 标签 */
  label: string
  /** 字段名 */
  name: string
  /** 是否在收起状态下显示 */
  showInCollapsed?: boolean
  /** 子组件 */
  children: React.ReactNode
  /** 额外的 Form.Item 属性 */
  formItemProps?: any
}

export const SearchItem: React.FC<SearchItemProps> = ({
  label,
  name,
  children,
  formItemProps,
  ...colProps
}) => {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const getColConfig = () => {
    if (isMobile) {
      return { xs: 24 }
    }
    return { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 }
  }

  return (
    <Col {...getColConfig()} {...colProps}>
      <Form.Item
        label={label}
        name={name}
        style={{ marginBottom: 0 }}
        {...formItemProps}
      >
        {children}
      </Form.Item>
    </Col>
  )
}

export default SearchForm