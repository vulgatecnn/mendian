// 通用组件导出
export { default as AuthGuard } from './AuthGuard'
export { default as NotFound } from './NotFound'
export { default as PageHeader } from './PageHeader'
// 使用统一的权限组件
export { PermissionButton, PermissionWrapper } from '../permission'
export { default as RoleGuard } from './RoleGuard'

// 新增通用组件
export { default as PageContainer } from './PageContainer'
export { default as SearchForm, SearchItem } from './SearchForm'
export { default as TableList, TableActions } from './TableList'
export { default as FormModal } from './FormModal'