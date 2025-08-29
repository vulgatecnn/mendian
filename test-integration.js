#!/usr/bin/env node
/**
 * 拓店管理模块集成测试脚本
 * 测试所有主要API端点和功能
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:7900';
const API_PREFIX = '/api/v1';

// 测试配置
const testConfig = {
  timeout: 5000,
  testUserId: 'test-user-001',
  testCandidateLocationId: 'test-location-001',
  testFollowUpId: 'test-followup-001',
};

// 颜色输出工具
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求工具
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${API_PREFIX}${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      timeout: testConfig.timeout,
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试用例集
const tests = [
  {
    name: '健康检查',
    method: 'GET',
    path: '/health',
    skipAuth: true,
    expected: {
      statusCode: 200,
      hasData: true,
    },
  },
  {
    name: 'API信息端点',
    method: 'GET',
    path: '',
    skipAuth: true,
    expected: {
      statusCode: 200,
      hasEndpoints: true,
    },
  },
  {
    name: '获取候选点位列表',
    method: 'GET',
    path: '/expansion/candidate-locations',
    expected: {
      statusCode: [200, 401], // 401 if not authenticated
    },
  },
  {
    name: '获取跟进记录列表',
    method: 'GET',
    path: '/expansion/follow-up-records',
    expected: {
      statusCode: [200, 401],
    },
  },
  {
    name: '获取地图数据',
    method: 'GET',
    path: '/expansion/expansion/map-data',
    expected: {
      statusCode: [200, 401],
    },
  },
  {
    name: '获取统计数据',
    method: 'GET',
    path: '/expansion/expansion/statistics',
    expected: {
      statusCode: [200, 401],
    },
  },
  {
    name: '获取拓店进度',
    method: 'GET',
    path: '/expansion/expansion/progress',
    expected: {
      statusCode: [200, 401],
    },
  },
  {
    name: '获取仪表板数据',
    method: 'GET',
    path: '/expansion/expansion/dashboard',
    expected: {
      statusCode: [200, 401],
    },
  },
];

// 运行单个测试
async function runTest(test) {
  try {
    log(`正在测试: ${test.name}...`, 'blue');
    
    const headers = test.skipAuth ? {} : {
      'Authorization': 'Bearer test-token', // 模拟认证令牌
    };

    const response = await makeRequest(test.method, test.path, test.data, headers);
    
    // 检查状态码
    const expectedStatusCodes = Array.isArray(test.expected.statusCode) 
      ? test.expected.statusCode 
      : [test.expected.statusCode];
    
    if (!expectedStatusCodes.includes(response.statusCode)) {
      log(`  ❌ 状态码不匹配。期望: ${test.expected.statusCode}, 实际: ${response.statusCode}`, 'red');
      return false;
    }

    // 检查响应数据
    if (test.expected.hasData && !response.data) {
      log(`  ❌ 缺少响应数据`, 'red');
      return false;
    }

    if (test.expected.hasEndpoints && !response.data.endpoints) {
      log(`  ❌ 缺少API端点信息`, 'red');
      return false;
    }

    log(`  ✅ 测试通过 (状态码: ${response.statusCode})`, 'green');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`  ❌ 连接被拒绝 - 服务器可能未启动`, 'red');
    } else if (error.message === 'Request timeout') {
      log(`  ❌ 请求超时`, 'red');
    } else {
      log(`  ❌ 测试失败: ${error.message}`, 'red');
    }
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  log('🚀 开始拓店管理模块集成测试...', 'blue');
  log(`目标服务器: ${BASE_URL}${API_PREFIX}`, 'yellow');
  log('', 'reset');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // 空行分隔
  }

  // 测试总结
  log('📊 测试总结:', 'blue');
  log(`通过: ${passed}`, 'green');
  log(`失败: ${failed}`, 'red');
  log(`总计: ${passed + failed}`, 'yellow');

  if (failed === 0) {
    log('\n🎉 所有测试通过!', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查服务器状态和配置', 'yellow');
  }

  // 返回测试结果
  return { passed, failed, total: passed + failed };
}

// 文件结构检查
function checkFileStructure() {
  const fs = require('fs');
  const path = require('path');
  
  log('🔍 检查文件结构...', 'blue');

  const criticalFiles = [
    // 后端文件
    'backend/src/server.ts',
    'backend/src/routes/index.ts',
    'backend/src/routes/v1/expansion.ts',
    'backend/src/controllers/v1/expansion.controller.ts',
    'backend/src/services/business/expansion.service.ts',
    'backend/src/types/expansion.ts',
    'backend/prisma/schema.prisma',
    
    // 前端文件
    'frontend/src/pages/expansion/CandidateLocationList.tsx',
    'frontend/src/pages/expansion/FollowList.tsx',
    'frontend/src/pages/expansion/ExpansionDashboard.tsx',
    'frontend/src/pages/expansion/ExpansionMap.tsx',
    'frontend/src/pages/expansion/ExpansionAnalytics.tsx',
    'frontend/src/pages/expansion/TaskAssignment.tsx',
    'frontend/src/pages/mobile/MobileExpansionList.tsx',
  ];

  let existingFiles = 0;
  let missingFiles = 0;

  for (const file of criticalFiles) {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
      log(`  ✅ ${file}`, 'green');
      existingFiles++;
    } else {
      log(`  ❌ ${file}`, 'red');
      missingFiles++;
    }
  }

  log(`\n文件检查结果: ${existingFiles} 存在, ${missingFiles} 缺失`, 
    missingFiles > 0 ? 'yellow' : 'green');
  
  return { existingFiles, missingFiles };
}

// 启动检查
async function checkServerStatus() {
  log('🏥 检查服务器状态...', 'blue');
  
  try {
    const response = await makeRequest('GET', '/health');
    if (response.statusCode === 200) {
      log('  ✅ 后端服务器正在运行', 'green');
      if (response.data.message) {
        log(`  📡 ${response.data.message}`, 'blue');
      }
      return true;
    } else {
      log(`  ⚠️  服务器响应异常 (状态码: ${response.statusCode})`, 'yellow');
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('  ❌ 服务器未启动或无法连接', 'red');
      log('  💡 请确保后端服务器在端口 7900 上运行', 'yellow');
      log('  💡 启动命令: cd backend && npm run dev', 'yellow');
    } else {
      log(`  ❌ 连接失败: ${error.message}`, 'red');
    }
    return false;
  }
}

// 主程序入口
async function main() {
  console.clear();
  log('=' .repeat(60), 'blue');
  log('🏪 好饭碗门店生命周期管理系统 - 拓店管理模块集成测试', 'blue');
  log('=' .repeat(60), 'blue');
  console.log('');

  // 1. 检查文件结构
  const fileCheck = checkFileStructure();
  console.log('');

  // 2. 检查服务器状态
  const serverRunning = await checkServerStatus();
  console.log('');

  // 3. 如果服务器运行，执行API测试
  if (serverRunning) {
    const testResults = await runAllTests();
    
    // 4. 生成最终报告
    log('=' .repeat(60), 'blue');
    log('📋 集成测试完成报告', 'blue');
    log('=' .repeat(60), 'blue');
    log(`文件结构: ${fileCheck.existingFiles} 存在 / ${fileCheck.missingFiles} 缺失`, 
      fileCheck.missingFiles > 0 ? 'yellow' : 'green');
    log(`API测试: ${testResults.passed} 通过 / ${testResults.failed} 失败`, 
      testResults.failed > 0 ? 'yellow' : 'green');
    
    if (fileCheck.missingFiles === 0 && testResults.failed === 0) {
      log('\n🎯 集成测试完全成功! 拓店管理模块已准备就绪。', 'green');
    } else {
      log('\n⚠️  发现一些问题，建议修复后再次测试。', 'yellow');
    }
  } else {
    log('⏸️  跳过API测试，因为服务器未运行', 'yellow');
    log('\n💡 启动服务器后重新运行此测试脚本', 'yellow');
  }

  console.log('');
  log('=' .repeat(60), 'blue');
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runAllTests,
  checkFileStructure,
  checkServerStatus,
  makeRequest,
};