// 前后端连接测试脚本
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:5000';

async function testConnection() {
  console.log('🔍 开始前后端连接测试...\n');

  // 测试1: 后端服务器状态
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/`, {
      timeout: 5000,
      validateStatus: () => true // 接受所有状态码
    });
    console.log('✅ 后端服务器状态:', response.status);
  } catch (error) {
    console.log('❌ 后端服务器连接失败:', error.message);
    return;
  }

  // 测试2: 前端服务器状态
  try {
    const response = await axios.get(FRONTEND_URL, {
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('✅ 前端服务器状态:', response.status);
  } catch (error) {
    console.log('❌ 前端服务器连接失败:', error.message);
    return;
  }

  // 测试3: API文档访问
  try {
    const response = await axios.get(`${API_BASE_URL}/api/docs/`, {
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('✅ API文档访问状态:', response.status);
  } catch (error) {
    console.log('❌ API文档访问失败:', error.message);
  }

  // 测试4: OpenAPI Schema
  try {
    const response = await axios.get(`${API_BASE_URL}/api/schema/`, {
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('✅ OpenAPI Schema状态:', response.status);
  } catch (error) {
    console.log('❌ OpenAPI Schema访问失败:', error.message);
  }

  // 测试5: CORS预检请求
  try {
    const response = await axios.options(`${API_BASE_URL}/api/permissions/`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('✅ CORS预检请求状态:', response.status);
  } catch (error) {
    console.log('❌ CORS预检请求失败:', error.message);
  }

  // 测试6: API权限验证
  try {
    const response = await axios.get(`${API_BASE_URL}/api/permissions/`, {
      headers: {
        'Origin': FRONTEND_URL
      },
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('✅ API权限验证状态:', response.status, '(403为正常，表示需要认证)');
  } catch (error) {
    console.log('❌ API权限验证失败:', error.message);
  }

  console.log('\n🎉 前后端连接测试完成！');
  console.log('\n📋 测试总结:');
  console.log('- 后端服务: http://localhost:8000');
  console.log('- 前端服务: http://localhost:5000');
  console.log('- API文档: http://localhost:8000/api/docs/');
  console.log('- 管理后台: http://localhost:8000/admin/ (用户名: admin, 密码: admin123)');
}

testConnection().catch(console.error);
