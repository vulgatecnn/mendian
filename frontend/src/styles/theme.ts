import type { ThemeConfig } from 'antd'

// 设计系统令牌
export interface DesignTokens {
  colors: {
    primary: Record<string, string>
    success: Record<string, string>
    warning: Record<string, string>
    error: Record<string, string>
    neutral: Record<string, string>
  }
  spacing: Record<string, string>
  typography: {
    fontFamily: string
    fontFamilyCode: string
    fontSize: Record<string, string>
    fontWeight: Record<string, number>
    lineHeight: Record<string, number>
  }
  borderRadius: Record<string, string>
  boxShadow: Record<string, string>
}

// 设计令牌配置
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#E6F7FF',
      100: '#BAE7FF',
      200: '#91D5FF',
      300: '#69C0FF',
      400: '#40A9FF',
      500: '#1890FF',
      600: '#096DD9',
      700: '#0050B3',
      800: '#003A8C',
      900: '#002766'
    },
    success: {
      50: '#F6FFED',
      100: '#D9F7BE',
      500: '#52C41A',
      600: '#389E0D',
      700: '#237804'
    },
    warning: {
      50: '#FFFBE6',
      100: '#FFF1B8',
      500: '#FAAD14',
      600: '#D48806',
      700: '#AD6800'
    },
    error: {
      50: '#FFF2F0',
      100: '#FFCCC7',
      500: '#FF4D4F',
      600: '#CF1322',
      700: '#A8071A'
    },
    neutral: {
      0: '#FFFFFF',
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#F0F0F0',
      300: '#D9D9D9',
      400: '#BFBFBF',
      500: '#8C8C8C',
      600: '#595959',
      700: '#434343',
      800: '#262626',
      900: '#1F1F1F'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
    fontFamilyCode: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace`,
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.67
    }
  },
  borderRadius: {
    sm: '4px',
    base: '6px',
    lg: '8px',
    xl: '12px',
    full: '50%'
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    base: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
}

// Antd主题配置
export const themeConfig: ThemeConfig = {
  token: {
    // 主色调 - 好饭碗品牌色
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // 中性色
    colorTextBase: '#000000',
    colorBgBase: '#ffffff',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    colorBgLayout: '#f5f5f5',

    // 组件配置
    borderRadius: 6,
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // 空间配置
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,

    wireframe: false
  },
  components: {
    // 表格配置
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      rowHoverBg: '#f5f5f5',
      borderColor: '#f0f0f0'
    },
    // 表单配置
    Form: {
      itemMarginBottom: 24,
      verticalLabelMargin: 8,
      labelFontSize: 14
    },
    // 布局配置
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      siderBg: '#001529'
    },
    // 菜单配置
    Menu: {
      darkItemBg: '#001529',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemSelectedBg: '#1890ff',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: '#1890ff',
      darkItemHoverColor: '#ffffff'
    },
    // 按钮配置
    Button: {
      borderRadius: 6,
      fontWeight: 400
    },
    // 卡片配置
    Card: {
      headerBg: '#fafafa',
      borderRadiusLG: 8
    },
    // 分页配置
    Pagination: {
      itemSize: 32
    }
  }
}

// CSS变量生成
export const generateCSSVariables = (tokens: DesignTokens) => {
  const cssVars: Record<string, string> = {}

  // 颜色变量
  Object.entries(tokens.colors).forEach(([colorName, colorScale]) => {
    Object.entries(colorScale).forEach(([scale, value]) => {
      cssVars[`--color-${colorName}-${scale}`] = value
    })
  })

  // 间距变量
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })

  // 字体变量
  cssVars['--font-family'] = tokens.typography.fontFamily
  cssVars['--font-family-code'] = tokens.typography.fontFamilyCode

  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value
  })

  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = value.toString()
  })

  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    cssVars[`--line-height-${key}`] = value.toString()
  })

  // 圆角变量
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--border-radius-${key}`] = value
  })

  // 阴影变量
  Object.entries(tokens.boxShadow).forEach(([key, value]) => {
    cssVars[`--box-shadow-${key}`] = value
  })

  return cssVars
}

// 生成CSS变量字符串
export const cssVariablesString = (() => {
  const vars = generateCSSVariables(designTokens)
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')
})()

// 主题类型
export type ThemeMode = 'light' | 'dark'

// 暗色主题配置
export const darkTokens: Partial<DesignTokens> = {
  colors: {
    ...designTokens.colors,
    neutral: {
      0: '#141414',
      50: '#1F1F1F',
      100: '#262626',
      200: '#303030',
      300: '#434343',
      400: '#595959',
      500: '#8C8C8C',
      600: '#BFBFBF',
      700: '#D9D9D9',
      800: '#F0F0F0',
      900: '#FFFFFF'
    }
  }
}

// 获取主题令牌
export const getThemeTokens = (mode: ThemeMode = 'light'): DesignTokens => {
  if (mode === 'dark') {
    return {
      ...designTokens,
      ...darkTokens
    } as DesignTokens
  }
  return designTokens
}
