import React from 'react'
import { vi } from 'vitest'

// Antd组件的完整Mock实现
export const antdMocks = {
  // 基础组件
  Button: vi.fn(({ children, onClick, ...props }) =>
    React.createElement('button', { onClick, ...props, 'data-testid': 'mock-button' }, children)
  ),
  
  Input: vi.fn(({ onChange, ...props }) =>
    React.createElement('input', {
      onChange: (e: any) => onChange?.(e),
      'data-testid': 'mock-input',
      ...props,
    })
  ),
  
  Select: vi.fn(({ children, onChange, value, ...props }) => {
    const handleChange = (e: any) => {
      onChange?.(e.target.value, e)
    }
    return React.createElement('select', {
      onChange: handleChange,
      value,
      'data-testid': 'mock-select',
      ...props,
    }, children)
  }),
  
  // 表单相关
  Form: Object.assign(
    vi.fn(({ children, onFinish, ...props }) =>
      React.createElement('form', {
        onSubmit: (e: any) => {
          e.preventDefault()
          onFinish?.(new FormData(e.target))
        },
        'data-testid': 'mock-form',
        ...props,
      }, children)
    ),
    {
      Item: vi.fn(({ children, label, name, ...props }) =>
        React.createElement('div', {
          'data-testid': `mock-form-item-${name}`,
          className: 'ant-form-item',
          ...props,
        }, [
          label && React.createElement('label', { key: 'label' }, label),
          React.createElement('div', { key: 'control' }, children)
        ])
      ),
      List: vi.fn(({ children }) =>
        React.createElement('div', { 'data-testid': 'mock-form-list' }, children)
      ),
      useForm: vi.fn(() => [
        {
          getFieldValue: vi.fn(),
          getFieldsValue: vi.fn(() => ({})),
          setFieldsValue: vi.fn(),
          resetFields: vi.fn(),
          validateFields: vi.fn(() => Promise.resolve({})),
          submit: vi.fn(),
        }
      ]),
    }
  ),
  
  // 表格组件
  Table: vi.fn(({ dataSource = [], columns = [], loading, pagination, ...props }) => {
    const renderCell = (record: any, column: any) => {
      if (column.render) {
        return column.render(record[column.dataIndex], record)
      }
      return record[column.dataIndex]
    }
    
    return React.createElement('div', {
      'data-testid': 'mock-table',
      className: 'ant-table',
      ...props,
    }, [
      // Table Header
      React.createElement('div', {
        key: 'header',
        className: 'ant-table-thead',
      }, React.createElement('tr', {}, columns.map((col: any, index: number) =>
        React.createElement('th', {
          key: index,
          className: col.sorter ? 'ant-table-column-sorters' : '',
          'data-testid': `table-header-${col.dataIndex}`,
        }, col.title)
      ))),
      
      // Table Body
      React.createElement('div', {
        key: 'body',
        className: 'ant-table-tbody',
      }, loading 
        ? React.createElement('div', { className: 'ant-spin-spinning' }, 'Loading...')
        : dataSource.map((record: any, rowIndex: number) =>
            React.createElement('tr', {
              key: rowIndex,
              'data-testid': `table-row-${rowIndex}`,
            }, columns.map((col: any, colIndex: number) =>
              React.createElement('td', {
                key: colIndex,
                'data-testid': `table-cell-${rowIndex}-${col.dataIndex}`,
              }, renderCell(record, col))
            ))
          )
      ),
      
      // Pagination
      pagination && React.createElement('div', {
        key: 'pagination',
        className: 'ant-pagination',
        'data-testid': 'mock-pagination',
      }, `Page ${pagination.current || 1} of ${Math.ceil((pagination.total || 0) / (pagination.pageSize || 10))}`)
    ])
  }),
  
  // 模态框
  Modal: Object.assign(
    vi.fn(({ children, open, visible, onOk, onCancel, title, ...props }) => {
      const isVisible = open || visible
      return isVisible ? React.createElement('div', {
        className: 'ant-modal',
        'data-testid': 'mock-modal',
        ...props,
      }, [
        React.createElement('div', {
          key: 'header',
          className: 'ant-modal-header',
        }, React.createElement('div', { className: 'ant-modal-title' }, title)),
        React.createElement('div', {
          key: 'body',
          className: 'ant-modal-body',
        }, children),
        React.createElement('div', {
          key: 'footer',
          className: 'ant-modal-footer',
        }, [
          React.createElement('button', {
            key: 'cancel',
            onClick: onCancel,
            className: 'ant-btn',
            'data-testid': 'modal-cancel',
          }, '取消'),
          React.createElement('button', {
            key: 'ok',
            onClick: onOk,
            className: 'ant-btn ant-btn-primary',
            'data-testid': 'modal-ok',
          }, '确定'),
        ]),
        React.createElement('button', {
          key: 'close',
          className: 'ant-modal-close',
          onClick: onCancel,
          'data-testid': 'modal-close',
        }, '×')
      ]) : null
    }),
    {
      confirm: vi.fn((config: any) => {
        const mockConfirm = {
          destroy: vi.fn(),
          update: vi.fn(),
        }
        config?.onOk?.()
        return mockConfirm
      }),
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    }
  ),
  
  // 抽屉
  Drawer: vi.fn(({ children, open, visible, onClose, title, placement = 'right', ...props }) => {
    const isVisible = open || visible
    return isVisible ? React.createElement('div', {
      className: 'ant-drawer',
      'data-testid': 'mock-drawer',
      'data-placement': placement,
      ...props,
    }, [
      React.createElement('div', {
        key: 'header',
        className: 'ant-drawer-header',
      }, [
        React.createElement('div', {
          key: 'title',
          className: 'ant-drawer-title',
        }, title),
        React.createElement('button', {
          key: 'close',
          className: 'ant-drawer-close',
          onClick: onClose,
          'data-testid': 'drawer-close',
        }, '×')
      ]),
      React.createElement('div', {
        key: 'body',
        className: 'ant-drawer-body',
      }, children)
    ]) : null
  }),
  
  // 日期选择器
  DatePicker: Object.assign(
    vi.fn(({ onChange, value, placeholder, ...props }) =>
      React.createElement('input', {
        type: 'text',
        onChange: (e: any) => onChange?.(e.target.value, e.target.value),
        value: typeof value === 'string' ? value : value?.format?.() || '',
        placeholder: placeholder || '选择日期',
        className: 'ant-picker-input',
        'data-testid': 'mock-date-picker',
        ...props,
      })
    ),
    {
      RangePicker: vi.fn(({ onChange, value, ...props }) =>
        React.createElement('div', {
          className: 'ant-picker-range',
          'data-testid': 'mock-range-picker',
          ...props,
        }, [
          React.createElement('input', {
            key: 'start',
            placeholder: '开始日期',
            onChange: (e: any) => onChange?.([e.target.value, value?.[1]]),
          }),
          React.createElement('span', { key: 'separator' }, ' ~ '),
          React.createElement('input', {
            key: 'end',
            placeholder: '结束日期',
            onChange: (e: any) => onChange?.([value?.[0], e.target.value]),
          })
        ])
      ),
    }
  ),
  
  // 标签页
  Tabs: Object.assign(
    vi.fn(({ children, onChange, activeKey, ...props }) =>
      React.createElement('div', {
        className: 'ant-tabs',
        'data-testid': 'mock-tabs',
        ...props,
      }, children)
    ),
    {
      TabPane: vi.fn(({ children, tab, key, ...props }) =>
        React.createElement('div', {
          role: 'tabpanel',
          'aria-label': tab,
          key,
          'data-testid': `tab-pane-${key}`,
          ...props,
        }, children)
      ),
    }
  ),
  
  // 下拉菜单
  Dropdown: vi.fn(({ children, overlay, trigger = ['hover'] }) =>
    React.createElement('div', {
      className: 'ant-dropdown-trigger',
      'data-testid': 'mock-dropdown',
      onClick: trigger.includes('click') ? () => {
        // 模拟显示下拉菜单
        document.body.appendChild(
          React.createElement('div', {
            className: 'ant-dropdown ant-dropdown-placement-bottom',
          }, overlay) as any
        )
      } : undefined,
    }, children)
  ),
  
  Menu: Object.assign(
    vi.fn(({ children, onClick, ...props }) =>
      React.createElement('ul', {
        className: 'ant-menu',
        onClick,
        'data-testid': 'mock-menu',
        ...props,
      }, children)
    ),
    {
      Item: vi.fn(({ children, key, onClick, ...props }) =>
        React.createElement('li', {
          className: 'ant-menu-item',
          'data-key': key,
          onClick: (e: any) => onClick?.({ key, domEvent: e }),
          'data-testid': `menu-item-${key}`,
          ...props,
        }, children)
      ),
      SubMenu: vi.fn(({ children, title, key, ...props }) =>
        React.createElement('li', {
          className: 'ant-menu-submenu',
          'data-key': key,
          'data-testid': `submenu-${key}`,
          ...props,
        }, [
          React.createElement('div', {
            key: 'title',
            className: 'ant-menu-submenu-title',
          }, title),
          React.createElement('ul', {
            key: 'children',
            className: 'ant-menu-sub',
          }, children)
        ])
      ),
    }
  ),
  
  // 消息提示
  message: {
    success: vi.fn((content: any) => {
      const messageElement = React.createElement('div', {
        className: 'ant-message-success',
        'data-testid': 'message-success',
      }, content)
      document.body.appendChild(messageElement as any)
      setTimeout(() => document.body.removeChild(messageElement as any), 3000)
    }),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    destroy: vi.fn(),
  },
  
  // 通知提醒
  notification: {
    success: vi.fn((config: any) => {
      const notificationElement = React.createElement('div', {
        className: 'ant-notification-notice ant-notification-notice-success',
        'data-testid': 'notification-success',
      }, [
        React.createElement('div', {
          key: 'title',
          className: 'ant-notification-notice-message',
        }, config.message),
        React.createElement('div', {
          key: 'description',
          className: 'ant-notification-notice-description',
        }, config.description)
      ])
      document.body.appendChild(notificationElement as any)
    }),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    destroy: vi.fn(),
  },
  
  // 加载中
  Spin: vi.fn(({ children, spinning = false, ...props }) =>
    React.createElement('div', {
      className: spinning ? 'ant-spin-spinning' : 'ant-spin',
      'data-testid': 'mock-spin',
      ...props,
    }, spinning 
      ? React.createElement('div', { className: 'ant-spin-dot' }, 'Loading...')
      : children
    )
  ),
  
  // 卡片
  Card: vi.fn(({ children, title, extra, actions, ...props }) =>
    React.createElement('div', {
      className: 'ant-card',
      'data-testid': 'mock-card',
      ...props,
    }, [
      (title || extra) && React.createElement('div', {
        key: 'header',
        className: 'ant-card-head',
      }, [
        title && React.createElement('div', {
          key: 'title',
          className: 'ant-card-head-title',
        }, title),
        extra && React.createElement('div', {
          key: 'extra',
          className: 'ant-card-extra',
        }, extra)
      ]),
      React.createElement('div', {
        key: 'body',
        className: 'ant-card-body',
      }, children),
      actions && React.createElement('ul', {
        key: 'actions',
        className: 'ant-card-actions',
      }, actions.map((action: any, index: number) =>
        React.createElement('li', { key: index }, action)
      ))
    ])
  ),
  
  // 步骤条
  Steps: Object.assign(
    vi.fn(({ children, current = 0, ...props }) =>
      React.createElement('div', {
        className: 'ant-steps',
        'data-testid': 'mock-steps',
        'data-current': current,
        ...props,
      }, children)
    ),
    {
      Step: vi.fn(({ title, description, status, ...props }) =>
        React.createElement('div', {
          className: `ant-steps-item ant-steps-item-${status || 'wait'}`,
          'data-testid': `step-${title}`,
          ...props,
        }, [
          React.createElement('div', {
            key: 'head',
            className: 'ant-steps-item-head',
          }),
          React.createElement('div', {
            key: 'content',
            className: 'ant-steps-item-content',
          }, [
            React.createElement('div', {
              key: 'title',
              className: 'ant-steps-item-title',
            }, title),
            description && React.createElement('div', {
              key: 'description',
              className: 'ant-steps-item-description',
            }, description)
          ])
        ])
      ),
    }
  ),
  
  // 标签
  Tag: vi.fn(({ children, color, closable, onClose, ...props }) =>
    React.createElement('span', {
      className: `ant-tag ${color ? `ant-tag-${color}` : ''}`,
      'data-testid': 'mock-tag',
      ...props,
    }, [
      children,
      closable && React.createElement('span', {
        key: 'close',
        className: 'ant-tag-close-icon',
        onClick: onClose,
        'data-testid': 'tag-close',
      }, '×')
    ])
  ),
  
  // 进度条
  Progress: vi.fn(({ percent = 0, status, ...props }) =>
    React.createElement('div', {
      className: `ant-progress ant-progress-${status || 'normal'}`,
      'data-testid': 'mock-progress',
      'data-percent': percent,
      ...props,
    }, `${percent}%`)
  ),
  
  // 警告提示
  Alert: vi.fn(({ message, description, type = 'info', closable, onClose, ...props }) =>
    React.createElement('div', {
      className: `ant-alert ant-alert-${type}`,
      'data-testid': 'mock-alert',
      ...props,
    }, [
      React.createElement('div', {
        key: 'message',
        className: 'ant-alert-message',
      }, message),
      description && React.createElement('div', {
        key: 'description',
        className: 'ant-alert-description',
      }, description),
      closable && React.createElement('button', {
        key: 'close',
        className: 'ant-alert-close-icon',
        onClick: onClose,
        'data-testid': 'alert-close',
      }, '×')
    ])
  ),
  
  // 树形控件
  Tree: vi.fn(({ treeData, onSelect, ...props }) =>
    React.createElement('div', {
      className: 'ant-tree',
      'data-testid': 'mock-tree',
      ...props,
    }, JSON.stringify(treeData))
  ),
  
  // 级联选择
  Cascader: vi.fn(({ options, onChange, value, placeholder, ...props }) =>
    React.createElement('div', {
      className: 'ant-cascader',
      'data-testid': 'mock-cascader',
      ...props,
    }, React.createElement('input', {
      placeholder: placeholder || '请选择',
      value: Array.isArray(value) ? value.join(' / ') : value,
      onChange: (e: any) => onChange?.(e.target.value?.split(' / ')),
    }))
  ),
  
  // 穿梭框
  Transfer: vi.fn(({ dataSource = [], targetKeys = [], onChange, ...props }) =>
    React.createElement('div', {
      className: 'ant-transfer',
      'data-testid': 'mock-transfer',
      ...props,
    }, `Transfer: ${targetKeys.length}/${dataSource.length} selected`)
  ),
  
  // 上传
  Upload: Object.assign(
    vi.fn(({ children, action, onChange, ...props }) =>
      React.createElement('div', {
        className: 'ant-upload',
        'data-testid': 'mock-upload',
        ...props,
      }, [
        React.createElement('input', {
          key: 'input',
          type: 'file',
          onChange: (e: any) => {
            const file = e.target.files?.[0]
            if (file) {
              onChange?.({
                file: { ...file, status: 'done' },
                fileList: [{ ...file, status: 'done' }]
              })
            }
          },
          'data-testid': 'upload-input',
        }),
        children
      ])
    ),
    {
      Dragger: vi.fn(({ children, ...props }) =>
        React.createElement('div', {
          className: 'ant-upload-drag',
          'data-testid': 'mock-upload-dragger',
          ...props,
        }, children)
      ),
    }
  ),
  
  // 评分
  Rate: vi.fn(({ value = 0, onChange, ...props }) =>
    React.createElement('div', {
      className: 'ant-rate',
      'data-testid': 'mock-rate',
      'data-value': value,
      ...props,
    }, `Rating: ${value}`)
  ),
  
  // 滑动输入条
  Slider: vi.fn(({ value = 0, onChange, min = 0, max = 100, ...props }) =>
    React.createElement('div', {
      className: 'ant-slider',
      'data-testid': 'mock-slider',
      ...props,
    }, React.createElement('input', {
      type: 'range',
      value,
      min,
      max,
      onChange: (e: any) => onChange?.(Number(e.target.value)),
    }))
  ),
}

// 导出Mock配置
export const setupAntdMocks = () => {
  vi.mock('antd', () => antdMocks)
  
  // Mock Antd的一些全局方法
  global.getComputedStyle = vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
  })) as any
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

export default antdMocks