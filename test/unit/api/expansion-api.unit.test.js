/**
 * 拓店管理API单元测试
 * 从根目录的test-expansion-api.js迁移而来
 * 测试拓店管理API的基本功能
 */

const API_BASE = 'http://localhost:8500/api/v1';

// 模拟候选点位数据
const candidateLocationData = {
  regionId: 'test-region-id',
  name: '测试候选点位',
  address: '北京市朝阳区测试街道123号',
  detailedAddress: '详细地址信息',
  area: 150,
  rentPrice: 5000,
  priority: 'HIGH'
};

// 测试创建候选点位
async function testCreateCandidateLocation() {
  console.log('\n=== 测试创建候选点位 ===');
  try {
    const response = await fetch(`${API_BASE}/expansion/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(candidateLocationData)
    });

    const result = await response.text();
    console.log('响应状态:', response.status);
    console.log('响应内容:', result);

    if (response.ok) {
      try {
        const jsonResult = JSON.parse(result);
        // 测试服务器返回的结构是 data.id，而非 data.candidateLocation.id
        return jsonResult.data?.id || jsonResult.data?.candidateLocation?.id;
      } catch (e) {
        console.log('响应不是有效的JSON格式');
        return null;
      }
    } else {
      console.log('创建失败');
      return null;
    }
  } catch (error) {
    console.error('请求错误:', error.message);
    return null;
  }
}

// 测试更新候选点位
async function testUpdateCandidateLocation(id) {
  console.log('\n=== 测试更新候选点位 ===');
  console.log('候选点位ID:', id);
  
  const updateData = {
    name: '更新后的候选点位名称',
    priority: 'URGENT',
    notes: '这是更新后的备注信息'
  };

  try {
    const response = await fetch(`${API_BASE}/expansion/candidates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.text();
    console.log('更新响应状态:', response.status);
    console.log('更新响应内容:', result);

    if (response.ok) {
      try {
        const jsonResult = JSON.parse(result);
        console.log('更新成功');
        return jsonResult.data || jsonResult.data?.candidateLocation;
      } catch (e) {
        console.log('更新响应不是有效的JSON格式');
        return null;
      }
    } else {
      console.log('更新失败');
      return null;
    }
  } catch (error) {
    console.error('更新请求错误:', error.message);
    return null;
  }
}

// 测试获取候选点位详情
async function testGetCandidateLocation(id) {
  console.log('\n=== 测试获取候选点位详情 ===');
  try {
    const response = await fetch(`${API_BASE}/expansion/candidates/${id}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const result = await response.text();
    console.log('获取详情响应状态:', response.status);
    console.log('获取详情响应内容:', result);

    if (response.ok) {
      try {
        const jsonResult = JSON.parse(result);
        console.log('获取详情成功');
        return jsonResult.data || jsonResult.data?.candidateLocation;
      } catch (e) {
        console.log('获取详情响应不是有效的JSON格式');
        return null;
      }
    }
  } catch (error) {
    console.error('获取详情请求错误:', error.message);
    return null;
  }
}

// 测试健康检查
async function testHealth() {
  console.log('=== 测试API健康检查 ===');
  try {
    const response = await fetch('http://localhost:8500/health');
    const result = await response.text();
    console.log('健康检查状态:', response.status);
    console.log('健康检查内容:', result);
    
    if (response.ok) {
      try {
        const jsonResult = JSON.parse(result);
        console.log('API服务正常运行');
        return true;
      } catch (e) {
        console.log('健康检查响应不是有效的JSON格式');
        return false;
      }
    } else {
      console.log('API服务异常');
      return false;
    }
  } catch (error) {
    console.error('连接API服务失败:', error.message);
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('开始测试拓店管理API...\n');
  
  // 1. 测试健康检查
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.log('\n❌ API服务不可用，请检查后端服务是否启动');
    return;
  }

  // 2. 测试创建候选点位
  const locationId = await testCreateCandidateLocation();
  if (!locationId) {
    console.log('\n❌ 创建候选点位失败，无法继续后续测试');
    return;
  }

  // 3. 测试更新候选点位
  const updatedLocation = await testUpdateCandidateLocation(locationId);
  if (updatedLocation) {
    console.log('\n✅ 更新测试成功，验证状态字段:', updatedLocation.status);
    console.log('验证优先级字段:', updatedLocation.priority);
  } else {
    console.log('\n❌ 更新测试失败');
  }

  // 4. 测试获取详情验证
  const locationDetail = await testGetCandidateLocation(locationId);
  if (locationDetail) {
    console.log('\n✅ 获取详情成功，最终状态:', locationDetail.status);
    console.log('最终优先级:', locationDetail.priority);
    console.log('最终备注:', locationDetail.notes);
  }

  console.log('\n测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testCreateCandidateLocation,
  testUpdateCandidateLocation,
  testGetCandidateLocation,
  testHealth
};
