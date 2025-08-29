import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Cascader, message } from 'antd'
import type { CascaderProps } from 'antd/es/cascader'
import { BasicDataApiService } from '@/services/api/basicData'
import type { Region } from '@/services/types'

interface RegionOption {
  value: string
  label: string
  level: number
  isLeaf?: boolean
  loading?: boolean
  children?: RegionOption[]
}

export interface RegionCascaderProps extends Omit<CascaderProps<RegionOption>, 'options' | 'loadData'> {
  /**
   * 最大级别 (1-省, 2-市, 3-区县, 4-街道)
   * @default 3
   */
  maxLevel?: number
  
  /**
   * 是否只能选择叶子节点
   * @default true
   */
  onlyLeaf?: boolean
  
  /**
   * 是否显示完整路径
   * @default true
   */
  showFullPath?: boolean
  
  /**
   * 初始化时是否加载所有数据
   * @default false
   */
  loadAll?: boolean
  
  /**
   * 值改变回调，返回完整的区域信息
   */
  onRegionChange?: (regions: Region[], options: RegionOption[]) => void
  
  /**
   * 自定义显示标签
   */
  displayRender?: (labels: string[], selectedOptions: RegionOption[]) => React.ReactNode
}

/**
 * 行政区域级联选择器
 */
const RegionCascader: React.FC<RegionCascaderProps> = ({
  maxLevel = 3,
  onlyLeaf = true,
  showFullPath = true,
  loadAll = false,
  onRegionChange,
  displayRender,
  onChange,
  ...props
}) => {
  const [options, setOptions] = useState<RegionOption[]>([])
  const [loading, setLoading] = useState(false)
  
  // 转换区域数据为选项格式
  const transformRegions = useCallback((regions: Region[], level: number = 1): RegionOption[] => {
    return regions.map(region => ({
      value: region.id,
      label: region.name,
      level: level,
      isLeaf: level >= maxLevel,
      children: region.children ? transformRegions(region.children, level + 1) : undefined
    }))
  }, [maxLevel])
  
  // 加载区域数据
  const loadRegionData = useCallback(async (parentId?: string, level: number = 1): Promise<Region[]> => {
    try {
      const response = await BasicDataApiService.getRegions({
        parentId,
        level,
        enabled: true
      })
      
      if (response.code === 200) {
        return response.data
      } else {
        throw new Error(response.message || '加载区域数据失败')
      }
    } catch (error) {
      console.error('加载区域数据失败:', error)
      message.error('加载区域数据失败')
      return []
    }
  }, [])
  
  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      try {
        if (loadAll) {
          // 加载所有数据
          const response = await BasicDataApiService.getRegionTree()
          if (response.code === 200) {
            const transformedOptions = transformRegions(response.data)
            setOptions(transformedOptions)
          }
        } else {
          // 只加载省份数据
          const provinces = await loadRegionData(undefined, 1)
          const transformedOptions = transformRegions(provinces, 1)
          setOptions(transformedOptions)
        }
      } catch (error) {
        console.error('初始化区域数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initData()
  }, [loadAll, transformRegions, loadRegionData])
  
  // 动态加载数据
  const loadData = useCallback(async (selectedOptions: RegionOption[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1]
    
    // 如果已经是最大级别，不需要加载子级
    if (targetOption.level >= maxLevel) {
      return
    }
    
    // 设置加载状态
    targetOption.loading = true
    setOptions([...options])
    
    try {
      // 加载子级数据
      const children = await loadRegionData(targetOption.value, targetOption.level + 1)
      const transformedChildren = transformRegions(children, targetOption.level + 1)
      
      // 更新选项
      targetOption.children = transformedChildren
      targetOption.loading = false
      targetOption.isLeaf = transformedChildren.length === 0 || targetOption.level + 1 >= maxLevel
      
      setOptions([...options])
    } catch {
      targetOption.loading = false
      setOptions([...options])
    }
  }, [options, maxLevel, loadRegionData, transformRegions])
  
  // 处理值变化
  const handleChange = useCallback((value: any, selectedOptions: RegionOption[]) => {
    // 调用原始onChange
    onChange?.(value, selectedOptions)
    
    // 调用自定义回调
    if (onRegionChange) {
      // 构造完整的区域信息
      const regions: Region[] = selectedOptions.map(option => ({
        id: option.value,
        name: option.label,
        level: option.level,
        code: '', // 这里可以根据需要补充
        enabled: true,
        sort: 0,
        createdAt: '',
        updatedAt: ''
      }))
      
      onRegionChange(regions, selectedOptions)
    }
  }, [onChange, onRegionChange])
  
  // 自定义显示格式
  const customDisplayRender = useMemo(() => {
    if (displayRender) {
      return displayRender
    }
    
    if (!showFullPath) {
      return (labels: string[], selectedOptions: RegionOption[]) => {
        const lastOption = selectedOptions[selectedOptions.length - 1]
        return lastOption ? lastOption.label : labels.join(' / ')
      }
    }
    
    return (labels: string[]) => labels.join(' / ')
  }, [displayRender, showFullPath])
  
  // 过滤器函数
  const filter = useCallback((inputValue: string, path: RegionOption[]) => {
    return path.some(option => option.label.toLowerCase().includes(inputValue.toLowerCase()))
  }, [])
  
  return (
    <Cascader<RegionOption>
      {...props}
      options={options}
      loadData={loadAll ? undefined : loadData}
      onChange={handleChange}
      displayRender={customDisplayRender}
      showSearch={{ filter }}
      changeOnSelect={!onlyLeaf}
      loading={loading}
      placeholder={props.placeholder || `请选择${maxLevel === 1 ? '省份' : maxLevel === 2 ? '省市' : maxLevel === 3 ? '省市区' : '完整地址'}`}
    />
  )
}

export default RegionCascader

// 导出区域级别常量
export const REGION_LEVELS = {
  PROVINCE: 1,
  CITY: 2,
  DISTRICT: 3,
  STREET: 4
} as const

// 导出区域级别名称
export const REGION_LEVEL_NAMES = {
  [REGION_LEVELS.PROVINCE]: '省份',
  [REGION_LEVELS.CITY]: '城市', 
  [REGION_LEVELS.DISTRICT]: '区县',
  [REGION_LEVELS.STREET]: '街道'
} as const