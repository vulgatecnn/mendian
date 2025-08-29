/**
 * HTTP测试服务器Mock
 * 从根目录的simple-test-server.js迁移而来
 * 提供简单的HTTP API模拟服务
 */

const http = require('http');
const url = require('url');

const PORT = 8500;

// 模拟数据
const mockCandidates = [
  {
    id: '1',
    name: '万达广场候选点',
    address: '上海市浦东新区世纪大道123号',
    area: 150,
    rentPrice: 35000,
    status: 'EVALUATING',
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

// 响应函数
const sendJSON = (res, data, statusCode = 200) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://localhost:8402',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });
  res.end(JSON.stringify(data));
};

// 解析请求体
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

// 服务器
const createServer = () => {
  return http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;

    // 处理CORS预检请求
    if (method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': 'http://localhost:8402',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      });
      res.end();
      return;
    }

    try {
      // 健康检查
      if (pathname === '/health') {
        sendJSON(res, {
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
        return;
      }

      // 候选点位列表
      if (pathname === '/api/v1/expansion/candidates' && method === 'GET') {
        sendJSON(res, {
          success: true,
          data: mockCandidates,
          total: mockCandidates.length,
          page: 1,
          pageSize: 10
        });
        return;
      }

      // 获取单个候选点位
      const candidateMatch = pathname.match(/^\/api\/v1\/expansion\/candidates\/([^\/]+)$/);
      if (candidateMatch && method === 'GET') {
        const candidate = mockCandidates.find(c => c.id === candidateMatch[1]);
        if (!candidate) {
          sendJSON(res, { success: false, message: '候选点位不存在' }, 404);
          return;
        }
        sendJSON(res, { success: true, data: candidate });
        return;
      }

      // 创建候选点位
      if (pathname === '/api/v1/expansion/candidates' && method === 'POST') {
        const body = await parseBody(req);
        const newCandidate = {
          id: String(mockCandidates.length + 1),
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockCandidates.push(newCandidate);
        sendJSON(res, { success: true, data: newCandidate }, 201);
        return;
      }

      // 更新候选点位
      if (candidateMatch && method === 'PUT') {
        const index = mockCandidates.findIndex(c => c.id === candidateMatch[1]);
        if (index === -1) {
          sendJSON(res, { success: false, message: '候选点位不存在' }, 404);
          return;
        }
        const body = await parseBody(req);
        mockCandidates[index] = {
          ...mockCandidates[index],
          ...body,
          updatedAt: new Date().toISOString()
        };
        sendJSON(res, { success: true, data: mockCandidates[index] });
        return;
      }

      // 删除候选点位
      if (candidateMatch && method === 'DELETE') {
        const index = mockCandidates.findIndex(c => c.id === candidateMatch[1]);
        if (index === -1) {
          sendJSON(res, { success: false, message: '候选点位不存在' }, 404);
          return;
        }
        mockCandidates.splice(index, 1);
        sendJSON(res, { success: true, message: '删除成功' });
        return;
      }

      // 跟进记录
      const followUpMatch = pathname.match(/^\/api\/v1\/expansion\/candidates\/([^\/]+)\/follow-ups$/);
      if (followUpMatch && method === 'GET') {
        const followUps = mockFollowUps.filter(f => f.candidateLocationId === followUpMatch[1]);
        sendJSON(res, { success: true, data: followUps, total: followUps.length });
        return;
      }

      if (followUpMatch && method === 'POST') {
        const body = await parseBody(req);
        const newFollowUp = {
          id: String(mockFollowUps.length + 1),
          candidateLocationId: followUpMatch[1],
          ...body,
          createdAt: new Date().toISOString()
        };
        mockFollowUps.push(newFollowUp);
        sendJSON(res, { success: true, data: newFollowUp }, 201);
        return;
      }

      // 统计数据
      if (pathname === '/api/v1/expansion/stats' && method === 'GET') {
        sendJSON(res, {
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
        return;
      }

      // 404
      sendJSON(res, { success: false, message: 'API端点不存在' }, 404);

    } catch (error) {
      console.error('服务器错误:', error);
      sendJSON(res, { success: false, message: '服务器内部错误' }, 500);
    }
  });
};

// 启动服务器
function startServer() {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(PORT, () => {
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
  createServer,
  startServer,
  mockCandidates,
  mockFollowUps,
  PORT
};
