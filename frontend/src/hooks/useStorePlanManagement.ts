/**
 * 开店计划管理Hook
 * 提供计划管理的常用操作和状态
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorePlan } from '../contexts/StorePlanContext';
import { StorePlanFormData, StorePlanQueryParams } from '../types';

/**
 * 开店计划管理Hook
 */
export const useStorePlanManagement = () => {
  const navigate = useNavigate();
  const storePlanContext = useStorePlan();

  /**
   * 导航到计划列表页
   */
  const goToPlanList = useCallback(() => {
    navigate('/store-planning/plans');
  }, [navigate]);

  /**
   * 导航到计划详情页
   */
  const goToPlanDetail = useCallback((id: number) => {
    navigate(`/store-planning/plans/${id}`);
  }, [navigate]);

  /**
   * 导航到计划创建页
   */
  const goToCreatePlan = useCallback(() => {
    navigate('/store-planning/plans/create');
  }, [navigate]);

  /**
   * 导航到计划编辑页
   */
  const goToEditPlan = useCallback((id: number) => {
    navigate(`/store-planning/plans/${id}/edit`);
  }, [navigate]);

  /**
   * 创建计划并导航到详情页
   */
  const createAndNavigate = useCallback(async (planData: StorePlanFormData) => {
    const newPlan = await storePlanContext.createPlan(planData);
    goToPlanDetail(newPlan.id);
    return newPlan;
  }, [storePlanContext, goToPlanDetail]);

  /**
   * 更新计划并导航到详情页
   */
  const updateAndNavigate = useCallback(async (id: number, planData: Partial<StorePlanFormData>) => {
    const updatedPlan = await storePlanContext.updatePlan(id, planData);
    goToPlanDetail(updatedPlan.id);
    return updatedPlan;
  }, [storePlanContext, goToPlanDetail]);

  /**
   * 删除计划并导航到列表页
   */
  const deleteAndNavigate = useCallback(async (id: number) => {
    await storePlanContext.deletePlan(id);
    goToPlanList();
  }, [storePlanContext, goToPlanList]);

  /**
   * 发布计划
   */
  const publishPlanWithRefresh = useCallback(async (id: number) => {
    await storePlanContext.publishPlan(id);
  }, [storePlanContext]);

  /**
   * 取消计划
   */
  const cancelPlanWithRefresh = useCallback(async (id: number, reason: string) => {
    await storePlanContext.cancelPlan(id, reason);
  }, [storePlanContext]);

  /**
   * 加载计划列表（带筛选）
   */
  const loadPlansWithFilters = useCallback(async (
    filters: Omit<StorePlanQueryParams, 'page' | 'page_size'>,
    page = 1,
    pageSize = 10
  ) => {
    await storePlanContext.loadPlans({
      ...filters,
      page,
      page_size: pageSize
    });
  }, [storePlanContext]);

  return {
    // 状态
    ...storePlanContext,
    
    // 导航方法
    goToPlanList,
    goToPlanDetail,
    goToCreatePlan,
    goToEditPlan,
    
    // 组合操作方法
    createAndNavigate,
    updateAndNavigate,
    deleteAndNavigate,
    publishPlanWithRefresh,
    cancelPlanWithRefresh,
    loadPlansWithFilters
  };
};

export default useStorePlanManagement;
