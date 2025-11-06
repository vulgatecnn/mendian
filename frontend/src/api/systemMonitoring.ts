import { apiClient } from './client';

export interface SystemHealthResponse {
  code: number;
  message: string;
  data: {
    overall_status: 'healthy' | 'warning' | 'critical' | 'error';
    timestamp: string;
    components: {
      [key: string]: {
        status: string;
        last_check: string;
        [key: string]: any;
      };
    };
    alerts: Array<{
      type: string;
      level: 'info' | 'warning' | 'critical';
      message: string;
      timestamp: string;
    }>;
    metrics: {
      [key: string]: any;
    };
  };
}

export interface SystemMetricsResponse {
  code: number;
  message: string;
  data: {
    metrics: {
      [key: string]: any;
    };
    collected_at: string;
  };
}

export interface SystemAlertsResponse {
  code: number;
  message: string;
  data: {
    current_alerts: Array<{
      type: string;
      level: string;
      message: string;
      timestamp: string;
    }>;
    historical_alerts: Array<{
      type: string;
      level: string;
      message: string;
      timestamp: string;
      log_time: string;
    }>;
    statistics: {
      current_alerts_count: number;
      historical_alerts_count: number;
      critical_alerts: number;
      warning_alerts: number;
      alert_types: { [key: string]: number };
    };
    query_period_days: number;
  };
}

export interface PerformanceOptimizationResponse {
  code: number;
  message: string;
  data: {
    optimization_results: {
      [key: string]: {
        optimizations_applied: string[];
        recommendations: string[];
        performance_improvement?: any;
        precomputed_metrics?: any[];
        cache_stats?: any;
        error?: string;
      };
    };
    optimized_at: string;
    dry_run: boolean;
  };
}

export interface ManualHealthCheckResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    message: string;
  };
}

export const systemMonitoringApi = {
  // 获取系统健康状态
  getSystemHealth: async (component?: string): Promise<SystemHealthResponse['data']> => {
    const params = component ? { component } : {};
    const response = await apiClient.get<SystemHealthResponse>('/data_analytics/monitoring/health/', {
      params
    });
    return response.data.data;
  },

  // 获取系统性能指标
  getSystemMetrics: async (): Promise<SystemMetricsResponse['data']> => {
    const response = await apiClient.get<SystemMetricsResponse>('/data_analytics/monitoring/metrics/');
    return response.data.data;
  },

  // 获取系统告警信息
  getSystemAlerts: async (days: number = 7): Promise<SystemAlertsResponse['data']> => {
    const response = await apiClient.get<SystemAlertsResponse>('/data_analytics/monitoring/alerts/', {
      params: { days }
    });
    return response.data.data;
  },

  // 执行性能优化
  optimizePerformance: async (params: {
    optimization_type?: 'database' | 'cache' | 'precomputation' | 'all';
    dry_run?: boolean;
  }): Promise<PerformanceOptimizationResponse['data']> => {
    const response = await apiClient.post<PerformanceOptimizationResponse>(
      '/data_analytics/monitoring/optimize/',
      params
    );
    return response.data.data;
  },

  // 手动执行健康检查
  manualHealthCheck: async (): Promise<ManualHealthCheckResponse['data']> => {
    const response = await apiClient.post<ManualHealthCheckResponse>(
      '/data_analytics/monitoring/health/',
      {}
    );
    return response.data.data;
  },

  // 发送告警通知
  sendAlertNotification: async (alert: {
    alert_type: string;
    level: 'info' | 'warning' | 'critical';
    message: string;
  }): Promise<any> => {
    const response = await apiClient.post('/data_analytics/monitoring/alerts/', alert);
    return response.data.data;
  },

  // 清除缓存
  clearCache: async (cache_type?: string): Promise<any> => {
    const response = await apiClient.post('/data_analytics/cache/refresh/', {
      cache_type,
      clear_only: true
    });
    return response.data.data;
  },

  // 刷新缓存
  refreshCache: async (cache_type?: string): Promise<any> => {
    const response = await apiClient.post('/data_analytics/cache/refresh/', {
      cache_type,
      clear_only: false
    });
    return response.data.data;
  }
};