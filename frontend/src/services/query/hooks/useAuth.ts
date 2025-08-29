// 认证相关的React Query Hooks
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '../config'
import { AuthApiService } from '../../api/auth'
import type {
  BaseResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfileResponse,
  PermissionCheckResponse,
  MenuResponse
} from '../../types'

/**
 * 用户登录
 */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation<BaseResponse<LoginResponse>, Error, LoginRequest>({
    mutationFn: AuthApiService.login,
    onSuccess: data => {
      message.success('登录成功')

      // 缓存用户信息
      queryClient.setQueryData(queryKeys.auth.user(), {
        ...data,
        data: data.data.user
      })

      // 预加载用户权限和菜单
      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.permissions(),
        queryFn: AuthApiService.getUserPermissions
      })

      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.menus(),
        queryFn: AuthApiService.getUserMenus
      })
    },
    onError: (error: any) => {
      console.error('登录失败:', error)
      message.error(error?.message || '登录失败')
    }
  })
}

/**
 * 用户登出
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation<BaseResponse<null>, Error>({
    mutationFn: AuthApiService.logout,
    onSuccess: () => {
      message.success('已安全退出')

      // 清除所有缓存
      queryClient.clear()

      // 跳转到登录页
      window.location.href = '/login'
    },
    onError: (error: any) => {
      console.error('登出失败:', error)
      // 即使登出API失败，也要清除本地缓存
      queryClient.clear()
      window.location.href = '/login'
    }
  })
}

/**
 * 刷新Token
 */
export function useRefreshToken() {
  return useMutation<BaseResponse<RefreshTokenResponse>, Error, RefreshTokenRequest>({
    mutationFn: AuthApiService.refreshToken,
    onError: (error: any) => {
      console.error('Token刷新失败:', error)
      // Token刷新失败，跳转到登录页
      window.location.href = '/login'
    }
  })
}

/**
 * 获取当前用户信息
 */
export function useUserInfo(): UseQueryResult<BaseResponse<UserProfileResponse>, Error> {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: AuthApiService.getUserInfo,
    staleTime: 10 * 60 * 1000, // 10分钟内不重新获取
    retry: (failureCount, error: any) => {
      // 401错误不重试
      if (error?.status === 401) {
        return false
      }
      return failureCount < 2
    }
  })
}

/**
 * 获取用户权限
 */
export function useUserPermissions(): UseQueryResult<BaseResponse<string[]>, Error> {
  return useQuery({
    queryKey: queryKeys.auth.permissions(),
    queryFn: AuthApiService.getUserPermissions,
    staleTime: 15 * 60 * 1000 // 15分钟内不重新获取
  })
}

/**
 * 检查用户权限
 */
export function useCheckPermissions(permissions: string[]) {
  return useQuery({
    queryKey: [...queryKeys.auth.permissions(), 'check', permissions],
    queryFn: () => AuthApiService.checkPermissions(permissions),
    enabled: permissions.length > 0,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取用户菜单
 */
export function useUserMenus(): UseQueryResult<BaseResponse<MenuResponse[]>, Error> {
  return useQuery({
    queryKey: queryKeys.auth.menus(),
    queryFn: AuthApiService.getUserMenus,
    staleTime: 15 * 60 * 1000 // 15分钟内不重新获取
  })
}

/**
 * 修改密码
 */
export function useChangePassword() {
  return useMutation<
    BaseResponse<null>,
    Error,
    {
      oldPassword: string
      newPassword: string
      confirmPassword: string
    }
  >({
    mutationFn: AuthApiService.changePassword,
    onSuccess: () => {
      message.success('密码修改成功，请重新登录')
      // 清除缓存并跳转到登录页
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    },
    onError: (error: any) => {
      console.error('修改密码失败:', error)
      message.error(error?.message || '修改密码失败')
    }
  })
}

/**
 * 获取验证码
 */
export function useCaptcha() {
  return useMutation<
    BaseResponse<{
      id: string
      image: string
    }>,
    Error
  >({
    mutationFn: AuthApiService.getCaptcha,
    onError: (error: any) => {
      console.error('获取验证码失败:', error)
      message.error('获取验证码失败')
    }
  })
}

/**
 * 验证验证码
 */
export function useVerifyCaptcha() {
  return useMutation<
    BaseResponse<boolean>,
    Error,
    {
      id: string
      code: string
    }
  >({
    mutationFn: ({ id, code }) => AuthApiService.verifyCaptcha(id, code)
  })
}

/**
 * 企业微信登录
 */
export function useWeChatLogin() {
  const queryClient = useQueryClient()

  return useMutation<
    BaseResponse<LoginResponse>,
    Error,
    {
      code: string
      state: string
    }
  >({
    mutationFn: AuthApiService.weChatLogin,
    onSuccess: data => {
      message.success('企微登录成功')

      // 缓存用户信息
      queryClient.setQueryData(queryKeys.auth.user(), {
        ...data,
        data: data.data.user
      })
    },
    onError: (error: any) => {
      console.error('企微登录失败:', error)
      message.error(error?.message || '企微登录失败')
    }
  })
}

/**
 * 绑定企业微信
 */
export function useBindWeChat() {
  return useMutation<
    BaseResponse<null>,
    Error,
    {
      code: string
      state: string
    }
  >({
    mutationFn: AuthApiService.bindWeChat,
    onSuccess: () => {
      message.success('绑定企业微信成功')
    },
    onError: (error: any) => {
      console.error('绑定企微失败:', error)
      message.error(error?.message || '绑定失败')
    }
  })
}

/**
 * 解绑企业微信
 */
export function useUnbindWeChat() {
  const queryClient = useQueryClient()

  return useMutation<BaseResponse<null>, Error>({
    mutationFn: AuthApiService.unbindWeChat,
    onSuccess: () => {
      message.success('解绑企业微信成功')

      // 刷新用户信息
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.user()
      })
    },
    onError: (error: any) => {
      console.error('解绑企微失败:', error)
      message.error(error?.message || '解绑失败')
    }
  })
}

/**
 * 更新用户资料
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<
    BaseResponse<UserProfileResponse>,
    Error,
    {
      name?: string
      email?: string
      phone?: string
      avatar?: string
    }
  >({
    mutationFn: AuthApiService.updateProfile,
    onSuccess: data => {
      message.success('资料更新成功')

      // 更新缓存
      queryClient.setQueryData(queryKeys.auth.user(), data)
    },
    onError: (error: any) => {
      console.error('更新资料失败:', error)
      message.error(error?.message || '更新失败')
    }
  })
}

/**
 * 上传头像
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation<
    BaseResponse<{
      url: string
    }>,
    Error,
    File
  >({
    mutationFn: AuthApiService.uploadAvatar,
    onSuccess: data => {
      message.success('头像上传成功')

      // 更新用户资料中的头像
      const userInfo = queryClient.getQueryData(
        queryKeys.auth.user()
      ) as BaseResponse<UserProfileResponse>
      if (userInfo) {
        queryClient.setQueryData(queryKeys.auth.user(), {
          ...userInfo,
          data: {
            ...userInfo.data,
            avatar: data.data.url
          }
        })
      }
    },
    onError: (error: any) => {
      console.error('头像上传失败:', error)
      message.error(error?.message || '头像上传失败')
    }
  })
}

/**
 * 获取登录历史
 */
export function useLoginHistory(params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: queryKeys.auth.loginHistory(params),
    queryFn: () => AuthApiService.getLoginHistory(params),
    enabled: !!params // 仅当有参数时才自动执行
  })
}

/**
 * 权限检查Hook（用于组件权限控制）
 */
export function usePermission(permission: string | string[]) {
  const { data: permissionsResponse } = useUserPermissions()

  const permissions = permissionsResponse?.data || []
  const checkPermissions = Array.isArray(permission) ? permission : [permission]

  const hasPermission = checkPermissions.every(p => permissions.includes(p))
  const hasAnyPermission = checkPermissions.some(p => permissions.includes(p))

  return {
    hasPermission,
    hasAnyPermission,
    permissions,
    loading: !permissionsResponse
  }
}
