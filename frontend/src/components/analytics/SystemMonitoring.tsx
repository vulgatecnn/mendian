import React, { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Typography,
  Button,
  Badge,
  Space,
  Progress,
  Statistic,
} from '@arco-design/web-react';
import {
  IconRefresh,
  IconCheckCircle,
  IconCloseCircle,
  IconExclamationCircle,
} from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

interface SystemStatus {
  service: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  cpu: number;
  memory: number;
}

const SystemMonitoring: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    { service: '数据库服务', status: 'running', uptime: '15天', cpu: 45, memory: 60 },
    { service: 'API服务', status: 'running', uptime: '15天', cpu: 30, memory: 40 },
    { service: '缓存服务', status: 'running', uptime: '15天', cpu: 10, memory: 20 },
    { service: '消息队列', status: 'running', uptime: '15天', cpu: 15, memory: 25 },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <IconCheckCircle style={{ color: '#00b42a' }} />;
      case 'stopped':
        return <IconCloseCircle style={{ color: '#f53f3f' }} />;
      case 'error':
        return <IconExclamationCircle style={{ color: '#ff7d00' }} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      running: { status: 'success' as const, text: '运行中' },
      stopped: { status: 'error' as const, text: '已停止' },
      error: { status: 'warning' as const, text: '异常' },
    };
    return statusMap[status as keyof typeof statusMap] || { status: 'default' as const, text: '未知' };
  };

  const handleRefresh = () => {
    // 刷新系统状态
    console.log('刷新系统状态');
  };

  return (
    <div>
      <Card
        title="系统监控"
        extra={
          <Button type="primary" icon={<IconRefresh />} onClick={handleRefresh}>
            刷新
          </Button>
        }
      >
        <Row gutter={16}>
          {systemStatus.map((item, index) => (
            <Col span={12} key={index} style={{ marginBottom: 16 }}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    {getStatusIcon(item.status)}
                    <Title heading={6}>{item.service}</Title>
                    <Badge {...getStatusBadge(item.status)} />
                  </Space>
                  <Text type="secondary">运行时间: {item.uptime}</Text>
                  <div>
                    <Text>CPU使用率</Text>
                    <Progress percent={item.cpu} />
                  </div>
                  <div>
                    <Text>内存使用率</Text>
                    <Progress percent={item.memory} />
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default SystemMonitoring;
