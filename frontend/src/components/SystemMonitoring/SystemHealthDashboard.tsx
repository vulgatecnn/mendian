import React, { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Typography,
  Badge,
  Progress,
  Alert,
  Button,
  Space,
  Statistic,
  Table,
  Tag,
  Modal,
  Spin,
  Tooltip,
  Row,
  Col
} from '@arco-design/web-react';
import {
  IconRefresh,
  IconExclamationCircleFill,
  IconCheckCircleFill,
  IconCloseCircleFill,
  IconInfoCircleFill,
  IconSettings,
  IconEye
} from '@arco-design/web-react/icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemMonitoringApi } from '../../api/systemMonitoring';

const { Row: GridRow, Col: GridCol } = Grid;

interface SystemHealthData {
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
}

const SystemHealthDashboard: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [alertsModalVisible, setAlertsModalVisible] = useState(false);
  const queryClient = useQueryClient();

  // 获取系统健康状态
  const {
    data: healthData,
    isLoading,
    error,
    refetch
  } = useQuery<SystemHealthData>({
    queryKey: ['systemHealth'],
    queryFn: systemMonitoringApi.getSystemHealth,
    refetchInterval: 30000, // 30秒自动刷新
    retry: 3
  });

  // 手动健康检查
  const manualHealthCheckMutation = useMutation({
    mutationFn: systemMonitoringApi.manualHealthCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
    }
  });

  // 性能优化
  const performanceOptimizationMutation = useMutation({
    mutationFn: (params: { type: string; dry_run: boolean }) =>
      systemMonitoringApi.optimizePerformance(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
    }
  });

  // 获取状态颜色和图标
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'green',
          icon: <IconCheckCircleFill style={{ color: '#00b42a' }} />,
          text: '正常'
        };
      case 'warning':
        return {
          color: 'orange',
          icon: <IconExclamationCircleFill style={{ color: '#ff7d00' }} />,
          text: '警告'
        };
      case 'critical':
        return {
          color: 'red',
          icon: <IconCloseCircleFill style={{ color: '#f53f3f' }} />,
          text: '严重'
        };
      case 'error':
        return {
          color: 'red',
          icon: <IconCloseCircleFill style={{ color: '#f53f3f' }} />,
          text: '错误'
        };
      default:
        return {
          color: 'gray',
          icon: <IconInfoCircleFill style={{ color: '#86909c' }} />,
          text: '未知'
        };
    }
  };

  // 组件状态卡片
  const ComponentStatusCard: React.FC<{
    name: string;
    data: any;
    onClick: () => void;
  }> = ({ name, data, onClick }) => {
    const statusDisplay = getStatusDisplay(data.status);
    
    return (
      <Card
        hoverable
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        title={
          <Space>
            {statusDisplay.icon}
            <span>{getComponentDisplayName(name)}</span>
            <Badge
              status={statusDisplay.color as any}
              text={statusDisplay.text}
            />
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {renderComponentMetrics(name, data)}
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            最后检查: {new Date(data.last_check).toLocaleString()}
          </Typography.Text>
        </Space>
      </Card>
    );
  };

  // 获取组件显示名称
  const getComponentDisplayName = (name: string) => {
    const nameMap: { [key: string]: string } = {
      database: '数据库',
      cache: '缓存系统',
      system: '系统资源',
      data_tasks: '数据任务',
      reports: '报表生成'
    };
    return nameMap[name] || name;
  };

  // 渲染组件指标
  const renderComponentMetrics = (name: string, data: any) => {
    switch (name) {
      case 'database':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="响应时间"
                value={data.response_time}
                suffix="s"
                precision={3}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="活跃连接"
                value={data.active_connections}
              />
            </Col>
          </Row>
        );
      
      case 'cache':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="命中率"
                value={data.hit_rate}
                suffix="%"
                precision={1}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="缓存键数"
                value={data.total_keys}
              />
            </Col>
          </Row>
        );
      
      case 'system':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Typography.Text>CPU使用率</Typography.Text>
              <Progress
                percent={data.cpu_percent}
                status={data.cpu_percent > 80 ? 'danger' : 'normal'}
                showText
              />
            </div>
            <div>
              <Typography.Text>内存使用率</Typography.Text>
              <Progress
                percent={data.memory_percent}
                status={data.memory_percent > 80 ? 'danger' : 'normal'}
                showText
              />
            </div>
          </Space>
        );
      
      case 'data_tasks':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="成功率"
                value={data.success_rate}
                suffix="%"
                precision={1}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="1小时任务数"
                value={data.total_tasks_1h}
              />
            </Col>
          </Row>
        );
      
      case 'reports':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="成功率"
                value={data.success_rate}
                suffix="%"
                precision={1}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="处理中"
                value={data.processing_tasks}
              />
            </Col>
          </Row>
        );
      
      default:
        return null;
    }
  };

  // 告警表格列配置
  const alertColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const colorMap = {
          info: 'blue',
          warning: 'orange',
          critical: 'red'
        };
        return <Tag color={colorMap[level as keyof typeof colorMap]}>{level}</Tag>;
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: string) => new Date(timestamp).toLocaleString()
    }
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size={40} />
        <Typography.Text style={{ display: 'block', marginTop: '16px' }}>
          正在加载系统健康状态...
        </Typography.Text>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="加载失败"
        content="无法获取系统健康状态，请检查网络连接或联系管理员"
        action={
          <Button size="small" onClick={() => refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const overallStatusDisplay = getStatusDisplay(healthData?.overall_status || 'unknown');

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题和操作 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title heading={4} style={{ margin: 0 }}>
            系统监控大屏
          </Typography.Title>
          <Typography.Text type="secondary">
            最后更新: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : '未知'}
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<IconRefresh />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新
          </Button>
          <Button
            icon={<IconSettings />}
            onClick={() => manualHealthCheckMutation.mutate()}
            loading={manualHealthCheckMutation.isPending}
          >
            手动检查
          </Button>
          <Button
            type="primary"
            onClick={() => performanceOptimizationMutation.mutate({ type: 'all', dry_run: false })}
            loading={performanceOptimizationMutation.isPending}
          >
            性能优化
          </Button>
        </Space>
      </div>

      {/* 整体状态卡片 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24} align="center">
          <Col>
            <Space size="large">
              {overallStatusDisplay.icon}
              <div>
                <Typography.Title heading={5} style={{ margin: 0 }}>
                  系统整体状态: {overallStatusDisplay.text}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {healthData?.alerts?.length || 0} 个告警
                </Typography.Text>
              </div>
            </Space>
          </Col>
          <Col flex={1}>
            {healthData?.alerts && healthData.alerts.length > 0 && (
              <Button
                type="text"
                icon={<IconEye />}
                onClick={() => setAlertsModalVisible(true)}
              >
                查看告警详情
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* 组件状态网格 */}
      <GridRow gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {healthData?.components && Object.entries(healthData.components).map(([name, data]) => (
          <GridCol span={8} key={name}>
            <ComponentStatusCard
              name={name}
              data={data}
              onClick={() => setSelectedComponent(name)}
            />
          </GridCol>
        ))}
      </GridRow>

      {/* 性能指标概览 */}
      {healthData?.metrics && (
        <Card title="性能指标概览" style={{ marginBottom: '24px' }}>
          <Row gutter={[24, 16]}>
            {/* 数据库指标 */}
            {healthData.metrics.database && (
              <Col span={6}>
                <Card size="small" title="数据库">
                  <Statistic
                    title="表操作数"
                    value={healthData.metrics.database.table_stats?.[0]?.total_operations || 0}
                  />
                </Card>
              </Col>
            )}
            
            {/* API指标 */}
            {healthData.metrics.api && (
              <Col span={6}>
                <Card size="small" title="API性能">
                  <Space direction="vertical">
                    <Statistic
                      title="平均响应时间"
                      value={healthData.metrics.api.avg_response_time}
                      suffix="s"
                      precision={3}
                    />
                    <Statistic
                      title="错误率"
                      value={healthData.metrics.api.error_rate}
                      suffix="%"
                      precision={1}
                    />
                  </Space>
                </Card>
              </Col>
            )}
            
            {/* 数据量指标 */}
            {healthData.metrics.data_volume && (
              <Col span={6}>
                <Card size="small" title="数据量">
                  <Space direction="vertical">
                    <Statistic
                      title="门店总数"
                      value={healthData.metrics.data_volume.stores_total}
                    />
                    <Statistic
                      title="运营门店"
                      value={healthData.metrics.data_volume.stores_operating}
                    />
                  </Space>
                </Card>
              </Col>
            )}
            
            {/* 缓存指标 */}
            {healthData.metrics.cache && (
              <Col span={6}>
                <Card size="small" title="缓存">
                  <Space direction="vertical">
                    <Statistic
                      title="命中率"
                      value={healthData.metrics.cache.hit_rate}
                      suffix="%"
                      precision={1}
                    />
                    <Statistic
                      title="缓存键数"
                      value={healthData.metrics.cache.total_keys}
                    />
                  </Space>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* 告警详情模态框 */}
      <Modal
        title="系统告警详情"
        visible={alertsModalVisible}
        onCancel={() => setAlertsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={alertColumns}
          data={healthData?.alerts || []}
          pagination={false}
          size="small"
        />
      </Modal>

      {/* 组件详情模态框 */}
      <Modal
        title={`${getComponentDisplayName(selectedComponent || '')} 详细信息`}
        visible={!!selectedComponent}
        onCancel={() => setSelectedComponent(null)}
        footer={null}
        width={600}
      >
        {selectedComponent && healthData?.components[selectedComponent] && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>状态: </Typography.Text>
                <Badge
                  status={getStatusDisplay(healthData.components[selectedComponent].status).color as any}
                  text={getStatusDisplay(healthData.components[selectedComponent].status).text}
                />
              </div>
              <div>
                <Typography.Text strong>最后检查: </Typography.Text>
                <Typography.Text>
                  {new Date(healthData.components[selectedComponent].last_check).toLocaleString()}
                </Typography.Text>
              </div>
              
              {/* 详细指标 */}
              <div style={{ marginTop: '16px' }}>
                <Typography.Title heading={6}>详细指标</Typography.Title>
                {Object.entries(healthData.components[selectedComponent])
                  .filter(([key]) => !['status', 'last_check'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '8px' }}>
                      <Typography.Text strong>{key}: </Typography.Text>
                      <Typography.Text>{String(value)}</Typography.Text>
                    </div>
                  ))}
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SystemHealthDashboard;