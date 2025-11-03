/**
 * 开店计划状态管理上下文
 * 用于管理计划数据状态和提供计划相关操作方法
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message } from '@arco-design/web-react';
import { PlanService } from '../api';
import { StorePlan, StorePlanFormData, StorePlanQueryParams, RegionalPlan } from '../types';

// 计划上下文接口定义
interface StorePlanContextType {
  // 计划列表状态
  plans: StorePlan[];
  plansLoading: boolean;
  plansPagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // 当前计划详情状态
  currentPlan: StorePlan | null;
  currentPlanLoading: boolean;
  
  // 计划列表操作
  loadPlans: (params?: StorePlanQueryParams) => Promise<void>;
  refreshPlans: () => Promise<void>;
  
  // 计划详情操作
  loadPlanDetail: (id: number) => Promise<void>;
  refreshCurrentPlan: () => Promise<void>;
  clearCurrentPlan: () => void;
  
  // 计划CRUD操作
  createPlan: (planData: StorePlanFormData) => Promise<StorePlan>;
  updatePlan: (id: number, planData: Partial<StorePlanFormData>) => Promise<StorePlan>;
  deletePlan: (id: number) => Promise<void>;
  
  // 计划状态操作
  publishPlan: (id: number) => Promise<void>;
  cancelPlan: (id: number, reason: string) => Promise<void>;
  
  // 本地状态更新（用于优化UI响应）
  updateLocalPlan: (id: number, updates: Partial<StorePlan>) => void;
  updateLocalRegionalPlan: (planId: number, regionalPlanId: number, updates: Partial<RegionalPlan>) => void;
}

// 创建上下文
const StorePlanContext = createContext<StorePlanContextType | undefined>(undefined);

// 上下文提供者组件属性
interface StorePlanProviderProps {
  children: ReactNode;
}

/**
 * 开店计划状态管理提供者组件
 */
export const StorePlanProvider: React.FC<StorePlanProviderProps> = ({ children }) => {
  // 计划列表状态
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansPagination, setPlansPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [lastQueryParams, setLastQueryParams] = useState<StorePlanQueryParams>({});
  
  // 当前计划详情状态
  const [currentPlan, setCurrentPlan] = useState<StorePlan | null>(null);
  const [currentPlanLoading, setCurrentPlanLoading] = useState(false);

  /**
   * 加载计划列表
   */
  const loadPlans = useCallback(async (params?: StorePlanQueryParams) => {
    try {
      setPlansLoading(true);
      
      const queryParams = {
        page: params?.page || 1,
        page_size: params?.page_size || 10,
        ...params
      };
      
      setLastQueryParams(queryParams);
      
      const response = await PlanService.getPlans(queryParams);
      
      setPlans(response.results);
      setPlansPagination({
        current: queryParams.page || 1,
        pageSize: queryParams.page_size || 10,
        total: response.count
      });
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载计划列表失败');
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  /**
   * 刷新计划列表（使用上次的查询参数）
   */
  const refreshPlans = useCallback(async () => {
    await loadPlans(lastQueryParams);
  }, [lastQueryParams, loadPlans]);

  /**
   * 加载计划详情
   */
  const loadPlanDetail = useCallback(async (id: number) => {
    try {
      setCurrentPlanLoading(true);
      const data = await PlanService.getPlanDetail(id);
      setCurrentPlan(data);
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载计划详情失败');
      setCurrentPlan(null);
      throw error;
    } finally {
      setCurrentPlanLoading(false);
    }
  }, []);

  /**
   * 刷新当前计划详情
   */
  const refreshCurrentPlan = useCallback(async () => {
    if (currentPlan?.id) {
      await loadPlanDetail(currentPlan.id);
    }
  }, [currentPlan?.id, loadPlanDetail]);

  /**
   * 清除当前计划详情
   */
  const clearCurrentPlan = useCallback(() => {
    setCurrentPlan(null);
  }, []);

  /**
   * 创建新计划
   */
  const createPlan = useCallback(async (planData: StorePlanFormData): Promise<StorePlan> => {
    try {
      const newPlan = await PlanService.createPlan(planData);
      Message.success('创建计划成功');
      
      // 刷新计划列表
      await refreshPlans();
      
      return newPlan;
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '创建计划失败');
      throw error;
    }
  }, [refreshPlans]);

  /**
   * 更新计划
   */
  const updatePlan = useCallback(async (id: number, planData: Partial<StorePlanFormData>): Promise<StorePlan> => {
    try {
      const updatedPlan = await PlanService.updatePlan(id, planData);
      Message.success('更新计划成功');
      
      // 如果更新的是当前计划，更新当前计划状态
      if (currentPlan?.id === id) {
        setCurrentPlan(updatedPlan);
      }
      
      // 更新列表中的计划
      setPlans(prevPlans =>
        prevPlans.map(plan => plan.id === id ? updatedPlan : plan)
      );
      
      return updatedPlan;
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '更新计划失败');
      throw error;
    }
  }, [currentPlan?.id]);

  /**
   * 删除计划
   */
  const deletePlan = useCallback(async (id: number): Promise<void> => {
    try {
      await PlanService.deletePlan(id);
      Message.success('删除计划成功');
      
      // 从列表中移除
      setPlans(prevPlans => prevPlans.filter(plan => plan.id !== id));
      
      // 如果删除的是当前计划，清除当前计划
      if (currentPlan?.id === id) {
        setCurrentPlan(null);
      }
      
      // 刷新列表以更新分页
      await refreshPlans();
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除计划失败');
      throw error;
    }
  }, [currentPlan?.id, refreshPlans]);

  /**
   * 发布计划
   */
  const publishPlan = useCallback(async (id: number): Promise<void> => {
    try {
      await PlanService.publishPlan(id);
      Message.success('发布计划成功');
      
      // 刷新当前计划或列表
      if (currentPlan?.id === id) {
        await refreshCurrentPlan();
      } else {
        await refreshPlans();
      }
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '发布计划失败');
      throw error;
    }
  }, [currentPlan?.id, refreshCurrentPlan, refreshPlans]);

  /**
   * 取消计划
   */
  const cancelPlan = useCallback(async (id: number, reason: string): Promise<void> => {
    try {
      await PlanService.cancelPlan(id, { cancel_reason: reason });
      Message.success('取消计划成功');
      
      // 刷新当前计划或列表
      if (currentPlan?.id === id) {
        await refreshCurrentPlan();
      } else {
        await refreshPlans();
      }
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '取消计划失败');
      throw error;
    }
  }, [currentPlan?.id, refreshCurrentPlan, refreshPlans]);

  /**
   * 本地更新计划（用于优化UI响应，不调用API）
   */
  const updateLocalPlan = useCallback((id: number, updates: Partial<StorePlan>) => {
    // 更新列表中的计划
    setPlans(prevPlans =>
      prevPlans.map(plan =>
        plan.id === id ? { ...plan, ...updates } : plan
      )
    );
    
    // 更新当前计划
    if (currentPlan?.id === id) {
      setCurrentPlan(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentPlan?.id]);

  /**
   * 本地更新区域计划（用于优化UI响应，不调用API）
   */
  const updateLocalRegionalPlan = useCallback((
    planId: number,
    regionalPlanId: number,
    updates: Partial<RegionalPlan>
  ) => {
    // 更新当前计划中的区域计划
    if (currentPlan?.id === planId && currentPlan.regional_plans) {
      setCurrentPlan(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          regional_plans: prev.regional_plans?.map(rp =>
            rp.id === regionalPlanId ? { ...rp, ...updates } : rp
          )
        };
      });
    }
  }, [currentPlan?.id]);

  // 上下文值
  const value: StorePlanContextType = {
    plans,
    plansLoading,
    plansPagination,
    currentPlan,
    currentPlanLoading,
    loadPlans,
    refreshPlans,
    loadPlanDetail,
    refreshCurrentPlan,
    clearCurrentPlan,
    createPlan,
    updatePlan,
    deletePlan,
    publishPlan,
    cancelPlan,
    updateLocalPlan,
    updateLocalRegionalPlan
  };

  return (
    <StorePlanContext.Provider value={value}>
      {children}
    </StorePlanContext.Provider>
  );
};

/**
 * 使用开店计划上下文的Hook
 */
export const useStorePlan = (): StorePlanContextType => {
  const context = useContext(StorePlanContext);
  if (context === undefined) {
    throw new Error('useStorePlan 必须在 StorePlanProvider 内部使用');
  }
  return context;
};

export default StorePlanContext;
