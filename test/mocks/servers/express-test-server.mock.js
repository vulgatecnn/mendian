/**
 * Express测试服务器Mock
 * 从根目录的test-server.js迁移而来
 * 提供完整的拓店管理API模拟服务
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8500;

// 中间件
app.use(cors({
  origin: 'http://localhost:8402',
  credentials: true
}));
app.use(express.json());

// 模拟数据
const mockCandidates = [
  {
    id: '1',
    name: '万达广场候选点',
    address: '上海市浦东新区世纪大道123号',
    area: 150,
    rentPrice: 35000,
    status: 'EVALUATING',
    priority: 'HIGH',
    contactPerson: '张经理',
    contactPhone: '13912345678',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: '2', 
    name: '商业街黄金位置',
    address: '北京市朝阳区建国路88号',
    area: 120,
    rentPrice: 28000,
    status: 'NEGOTIATING',
    priority: 'MEDIUM',
    contactPerson: '李总',
    contactPhone: '13987654321',
    createdAt: '2024-08-02T14:30:00Z',
    updatedAt: '2024-08-02T14:30:00Z'
  }
];

const mockFollowUps = [
  {
    id: '1',
    candidateLocationId: '1',
    content: '初步洽谈，了解基本情况',
    followUpType: 'PHONE_CALL',
    followUpDate: '2024-08-03T09:00:00Z',
    nextFollowUpDate: '2024-08-05T09:00:00Z',
    createdBy: 'user1',
    createdAt: '2024-08-03T09:30:00Z'
  }
];

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '好饭碗门店生命周期管理系统 API - 测试服务器',
    version: '1.0.0-test',
    timestamp: new Date().toISOString(),
    environment: 'development',
    status: 'healthy',
    services: {
      database: 'mock',
      redis: 'mock', 
      api: 'online'
    }
  });
});

// 候选点位API
app.get('/api/v1/expansion/candidates', (req, res) => {
  res.json({
    success: true,
    data: mockCandidates,
    total: mockCandidates.length,
    page: 1,
    pageSize: 10
  });
});

app.get('/api/v1/expansion/candidates/:id', (req, res) => {
  const candidate = mockCandidates.find(c => c.id === req.params.id);
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: '候选点位不存在'
    });
  }
  res.json({
    success: true,
    data: candidate
  });
});

app.post('/api/v1/expansion/candidates', (req, res) => {
  const newCandidate = {
    id: String(mockCandidates.length + 1),
    status: 'PENDING', // 默认状态
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockCandidates.push(newCandidate);
  res.status(201).json({
    success: true,
    data: newCandidate
  });
});

app.put('/api/v1/expansion/candidates/:id', (req, res) => {
  const index = mockCandidates.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '候选点位不存在'
    });
  }
  mockCandidates[index] = {
    ...mockCandidates[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({
    success: true,
    data: mockCandidates[index]
  });
});

app.delete('/api/v1/expansion/candidates/:id', (req, res) => {
  const index = mockCandidates.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '候选点位不存在'
    });
  }
  mockCandidates.splice(index, 1);
  res.json({
    success: true,
    message: '删除成功'
  });
});

// 跟进记录API
app.get('/api/v1/expansion/candidates/:id/follow-ups', (req, res) => {
  const followUps = mockFollowUps.filter(f => f.candidateLocationId === req.params.id);
  res.json({
    success: true,
    data: followUps,
    total: followUps.length
  });
});

app.post('/api/v1/expansion/candidates/:id/follow-ups', (req, res) => {
  const newFollowUp = {
    id: String(mockFollowUps.length + 1),
    candidateLocationId: req.params.id,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockFollowUps.push(newFollowUp);
  res.status(201).json({
    success: true,
    data: newFollowUp
  });
});

// 统计数据API
app.get('/api/v1/expansion/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalCandidates: mockCandidates.length,
      evaluatingCount: mockCandidates.filter(c => c.status === 'EVALUATING').length,
      negotiatingCount: mockCandidates.filter(c => c.status === 'NEGOTIATING').length,
      approvedCount: mockCandidates.filter(c => c.status === 'APPROVED').length,
      averageArea: mockCandidates.reduce((sum, c) => sum + c.area, 0) / mockCandidates.length,
      averageRent: mockCandidates.reduce((sum, c) => sum + c.rentPrice, 0) / mockCandidates.length,
      monthlyStats: [
        { month: '2024-08', count: mockCandidates.length },
        { month: '2024-07', count: 3 },
        { month: '2024-06', count: 2 }
      ]
    }
  });
});

// 启动服务器
function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 测试API服务器启动成功!`);
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 候选点位API: http://localhost:${PORT}/api/v1/expansion/candidates`);
      console.log(`📊 统计数据API: http://localhost:${PORT}/api/v1/expansion/stats`);
      resolve(server);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('📴 接收到SIGTERM信号，服务器即将关闭...');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      console.log('📴 接收到SIGINT信号，服务器即将关闭...');
      server.close(() => process.exit(0));
    });
  });
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  mockCandidates,
  mockFollowUps
};
