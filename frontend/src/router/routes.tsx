/**
 * 路由配置
 */

import { lazy } from 'react'
import type { AppRouteObject } from './types'
import { PERMISSIONS } from '../constants/permissions'

// 懒加载页面组件
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const StorePlanList = lazy(() => import('../pages/store-plan'))
const StorePlanCreate = lazy(() => import('../pages/store-plan/Create'))
const StorePlanDetail = lazy(() => import('../pages/store-plan/Detail'))
const StorePlanDetailEnhanced = lazy(() => import('../pages/store-plan/DetailEnhanced'))
const StorePlanEdit = lazy(() => import('../pages/store-plan/Edit'))
const StorePlanDashboard = lazy(() => import('../pages/store-plan/Dashboard'))
const StorePlanStatistics = lazy(() => import('../pages/store-plan/Statistics'))
const MobilePlanList = lazy(() => import('../pages/store-plan/MobilePlanList'))
const ExpansionIndex = lazy(() => import('../pages/expansion'))
const CandidateLocationList = lazy(() => import('../pages/expansion/CandidateLocationList'))
const CandidateLocationDetail = lazy(() => import('../pages/expansion/CandidateLocationDetail'))
const CandidateLocationForm = lazy(() => import('../pages/expansion/CandidateLocationForm'))
const ExpansionDashboard = lazy(() => import('../pages/expansion/ExpansionDashboard'))
const PreparationIndex = lazy(() => import('../pages/preparation'))
const PreparationProjectList = lazy(() => import('../pages/preparation/PreparationProjectList'))
const PreparationProjectDetail = lazy(() => import('../pages/preparation/PreparationProjectDetail'))
const PreparationProjectForm = lazy(() => import('../pages/preparation/PreparationProjectForm'))
const PreparationDashboard = lazy(() => import('../pages/preparation/PreparationDashboard'))
const StoreFilesIndex = lazy(() => import('../pages/store-files'))
const OperationIndex = lazy(() => import('../pages/operation'))
const ApprovalIndex = lazy(() => import('../pages/approval'))
const BasicDataList = lazy(() => import('../pages/basic-data/BasicDataList'))

// 布局组件
import MainLayout from '../components/layout/MainLayout'
import NotFound from '../components/common/NotFound'

/**
 * 路由配置
 */
export const routes: AppRouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    meta: {
      title: '好饭碗门店管理系统',
      requireAuth: true
    },
    children: [
      // 系统首页 - index路由
      {
        index: true,
        component: Dashboard,
        meta: {
          title: '系统首页',
          breadcrumbTitle: '首页',
          permissions: [PERMISSIONS.DASHBOARD.VIEW],
          icon: 'dashboard',
          sort: 1,
          hideInMenu: true
        }
      },
      // 系统首页 - 具名路由
      {
        path: 'dashboard',
        component: Dashboard,
        meta: {
          title: '系统首页',
          breadcrumbTitle: '首页',
          permissions: [PERMISSIONS.DASHBOARD.VIEW],
          icon: 'dashboard',
          sort: 1
        }
      },

      // 开店计划管理
      {
        path: 'store-plan',
        component: StorePlanList,
        meta: {
          title: '开店计划',
          icon: 'project',
          sort: 2,
          permissions: [PERMISSIONS.STORE_PLAN.VIEW]
        }
      },
      {
        path: 'store-plan/dashboard',
        component: StorePlanDashboard,
        meta: {
          title: '计划看板',
          permissions: [PERMISSIONS.STORE_PLAN.VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'store-plan/statistics',
        component: StorePlanStatistics,
        meta: {
          title: '统计分析',
          permissions: [PERMISSIONS.STORE_PLAN.VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'store-plan/mobile',
        component: MobilePlanList,
        meta: {
          title: '移动端列表',
          permissions: [PERMISSIONS.STORE_PLAN.VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'store-plan/create',
        component: StorePlanCreate,
        meta: {
          title: '新建计划',
          permissions: [PERMISSIONS.STORE_PLAN.CREATE],
          hideInMenu: true
        }
      },
      {
        path: 'store-plan/:id',
        component: StorePlanDetailEnhanced,
        meta: {
          title: '计划详情',
          permissions: [PERMISSIONS.STORE_PLAN.VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'store-plan/:id/edit',
        component: StorePlanEdit,
        meta: {
          title: '编辑计划',
          permissions: [PERMISSIONS.STORE_PLAN.UPDATE],
          hideInMenu: true
        }
      },

      // 拓店管理
      {
        path: 'expansion',
        component: ExpansionIndex,
        meta: {
          title: '拓店管理',
          icon: 'shop',
          sort: 3,
          permissions: [PERMISSIONS.EXPANSION.VIEW]
        }
      },
      {
        path: 'expansion/candidates',
        component: CandidateLocationList,
        meta: {
          title: '候选点位',
          permissions: [PERMISSIONS.EXPANSION.CANDIDATES_VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'expansion/candidates/create',
        component: CandidateLocationForm,
        meta: {
          title: '新增候选点位',
          permissions: [PERMISSIONS.EXPANSION.CANDIDATES_CREATE],
          hideInMenu: true
        }
      },
      {
        path: 'expansion/candidates/:id',
        component: CandidateLocationDetail,
        meta: {
          title: '候选点位详情',
          permissions: [PERMISSIONS.EXPANSION.CANDIDATES_VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'expansion/candidates/:id/edit',
        component: CandidateLocationForm,
        meta: {
          title: '编辑候选点位',
          permissions: [PERMISSIONS.EXPANSION.CANDIDATES_UPDATE],
          hideInMenu: true
        }
      },
      {
        path: 'expansion/dashboard',
        component: ExpansionDashboard,
        meta: {
          title: '拓店数据仪表板',
          permissions: [PERMISSIONS.EXPANSION.DASHBOARD_VIEW],
          hideInMenu: true
        }
      },

      // 开店筹备
      {
        path: 'preparation',
        component: PreparationIndex,
        meta: {
          title: '开店筹备',
          icon: 'build',
          sort: 4,
          permissions: [PERMISSIONS.PREPARATION.VIEW]
        }
      },
      {
        path: 'preparation/projects',
        component: PreparationProjectList,
        meta: {
          title: '筹备项目',
          permissions: [PERMISSIONS.PREPARATION.VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'preparation/projects/create',
        component: PreparationProjectForm,
        meta: {
          title: '新建项目',
          permissions: [PERMISSIONS.PREPARATION.CREATE],
          hideInMenu: true
        }
      },
      {
        path: 'preparation/projects/:id',
        component: PreparationProjectDetail,
        meta: {
          title: '项目详情',
          permissions: [PERMISSIONS.PREPARATION.VIEW],
          hideInMenu: true
        }
      },
      {
        path: 'preparation/projects/:id/edit',
        component: PreparationProjectForm,
        meta: {
          title: '编辑项目',
          permissions: [PERMISSIONS.PREPARATION.UPDATE],
          hideInMenu: true
        }
      },
      {
        path: 'preparation/dashboard',
        component: PreparationDashboard,
        meta: {
          title: '数据仪表板',
          permissions: [PERMISSIONS.PREPARATION.DASHBOARD_VIEW],
          hideInMenu: true
        }
      },

      // 门店档案
      {
        path: 'store-files',
        component: StoreFilesIndex,
        meta: {
          title: '门店档案',
          icon: 'folder',
          sort: 5,
          permissions: [PERMISSIONS.STORE_FILES.VIEW]
        }
      },

      // 门店运营
      {
        path: 'operation',
        component: OperationIndex,
        meta: {
          title: '门店运营',
          icon: 'monitor',
          sort: 6,
          permissions: [PERMISSIONS.OPERATION.VIEW]
        }
      },

      // 审批中心
      {
        path: 'approval',
        component: ApprovalIndex,
        meta: {
          title: '审批中心',
          icon: 'audit',
          sort: 7,
          permissions: [PERMISSIONS.APPROVAL.VIEW]
        }
      },

      // 基础数据
      {
        path: 'basic-data',
        component: BasicDataList,
        meta: {
          title: '基础数据',
          icon: 'database',
          sort: 8,
          permissions: [PERMISSIONS.BASIC_DATA.VIEW]
        }
      }
    ]
  },

  // 404页面
  {
    path: '*',
    element: <NotFound />
  }
]

/**
 * 获取扁平化的路由配置
 */
export const getFlatRoutes = (routes: AppRouteObject[]): AppRouteObject[] => {
  const flatRoutes: AppRouteObject[] = []

  const traverse = (routes: AppRouteObject[], parentPath = '') => {
    routes.forEach(route => {
      const fullPath = parentPath + (route.path || '')

      flatRoutes.push({
        ...route,
        path: fullPath
      })

      if (route.children) {
        traverse(route.children, fullPath + '/')
      }
    })
  }

  traverse(routes)
  return flatRoutes
}

/**
 * 根据权限过滤路由
 */
export const filterRoutesByPermission = (
  routes: AppRouteObject[],
  userPermissions: string[]
): AppRouteObject[] => {
  return routes
    .filter(route => {
      const { permissions, requireAuth } = route.meta || {}

      // 如果需要认证但用户没有登录，过滤掉
      if (requireAuth && !userPermissions.length) {
        return false
      }

      // 如果没有权限要求，保留路由
      if (!permissions || !permissions.length) {
        return true
      }

      // 检查用户是否有所需权限
      return permissions.some(permission => userPermissions.includes(permission))
    })
    .map(route => {
      const filteredRoute = { ...route }
      if (route.children) {
        filteredRoute.children = filterRoutesByPermission(route.children, userPermissions)
      }
      return filteredRoute
    })
}