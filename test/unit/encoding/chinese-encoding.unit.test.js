/**
 * 中文字符编码测试
 * 从根目录的test-chinese-encoding.js迁移而来
 * 测试API对中文字符的编码处理
 */

const API_BASE = 'http://localhost:8500/api/v1';

// 测试中文编码
async function testChineseEncoding() {
  console.log('=== 测试中文字符编码 ===');
  
  const chineseData = {
    regionId: 'test-region-id',
    name: '测试中文候选点位名称',
    address: '北京市朝阳区测试街道１２３号',
    detailedAddress: '详细地址：测试大厦A座８楼',
    notes: '备注：这是一个包含中文字符的测试点位，用于验证编码正确性。',
    priority: 'HIGH'
  };

  try {
    console.log('发送的中文数据:', JSON.stringify(chineseData, null, 2));
    
    const response = await fetch(`${API_BASE}/expansion/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(chineseData)
    });

    console.log('响应状态:', response.status);
    console.log('响应头 Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('原始响应文本:', responseText);
    
    try {
      const jsonResult = JSON.parse(responseText);
      console.log('解析后的JSON:', JSON.stringify(jsonResult, null, 2));
      
      if (jsonResult.data) {
        console.log('\n字符编码验证:');
        console.log('名称:', jsonResult.data.name);
        console.log('地址:', jsonResult.data.address);
        console.log('详细地址:', jsonResult.data.detailedAddress);
        console.log('备注:', jsonResult.data.notes);
        
        // 验证中文是否正确显示
        const correctName = '测试中文候选点位名称';
        const receivedName = jsonResult.data.name;
        
        if (receivedName === correctName) {
          console.log('✅ 中文编码正常');
        } else {
          console.log('❌ 中文编码异常');
          console.log('期望:', correctName);
          console.log('实际:', receivedName);
        }
      }
      
      return jsonResult.data?.id;
    } catch (e) {
      console.log('❌ 响应不是有效的JSON格式');
      console.log('解析错误:', e.message);
      return null;
    }
  } catch (error) {
    console.error('请求错误:', error.message);
    return null;
  }
}

// 测试更新中文数据
async function testUpdateChineseEncoding(id) {
  console.log('\n=== 测试更新中文数据编码 ===');
  
  const updateData = {
    name: '更新后的中文名称：测试编码',
    notes: '更新备注：包含特殊字符￥、中文标点符号。'
  };

  try {
    console.log('更新的中文数据:', JSON.stringify(updateData, null, 2));
    
    const response = await fetch(`${API_BASE}/expansion/candidates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(updateData)
    });

    console.log('更新响应状态:', response.status);
    console.log('更新响应头 Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('更新原始响应文本:', responseText);
    
    try {
      const jsonResult = JSON.parse(responseText);
      console.log('更新解析后的JSON:', JSON.stringify(jsonResult, null, 2));
      
      if (jsonResult.data) {
        console.log('\n更新后字符编码验证:');
        console.log('名称:', jsonResult.data.name);
        console.log('备注:', jsonResult.data.notes);
        
        // 验证更新后的中文是否正确显示
        const correctName = '更新后的中文名称：测试编码';
        const receivedName = jsonResult.data.name;
        
        if (receivedName === correctName) {
          console.log('✅ 更新后中文编码正常');
        } else {
          console.log('❌ 更新后中文编码异常');
          console.log('期望:', correctName);
          console.log('实际:', receivedName);
        }
      }
      
      return jsonResult.data;
    } catch (e) {
      console.log('❌ 更新响应不是有效的JSON格式');
      return null;
    }
  } catch (error) {
    console.error('更新请求错误:', error.message);
    return null;
  }
}

// 主测试流程
async function runEncodingTests() {
  console.log('开始测试中文字符编码...\n');
  
  // 1. 测试创建中文数据
  const locationId = await testChineseEncoding();
  if (!locationId) {
    console.log('\n❌ 创建中文数据失败，无法继续测试');
    return;
  }

  // 2. 测试更新中文数据
  const updatedLocation = await testUpdateChineseEncoding(locationId);
  if (updatedLocation) {
    console.log('\n✅ 中文编码测试完成');
  } else {
    console.log('\n❌ 更新中文数据测试失败');
  }

  console.log('\n中文编码测试结束！');
}

// 运行测试
if (require.main === module) {
  runEncodingTests().catch(console.error);
}

module.exports = {
  runEncodingTests,
  testChineseEncoding,
  testUpdateChineseEncoding
};
