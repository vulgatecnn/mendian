/**
 * 测试前端API代理是否正常工作
 */

// 测试通过前端代理调用后端API
async function testFrontendProxy() {
    console.log('🚀 测试前端API代理...\n');
    
    const tests = [
        {
            name: '登录API',
            url: 'http://localhost:5000/api/auth/login/',
            method: 'POST',
            body: {
                login_type: 'username_password',
                username: 'admin',
                password: 'admin123'
            }
        },
        {
            name: '用户列表API',
            url: 'http://localhost:5000/api/users/',
            method: 'GET'
        },
        {
            name: '部门列表API',
            url: 'http://localhost:5000/api/departments/',
            method: 'GET'
        }
    ];
    
    let token = null;
    
    for (const test of tests) {
        try {
            console.log(`📡 测试 ${test.name}...`);
            
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            };
            
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }
            
            const response = await fetch(test.url, options);
            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ ${test.name} 成功!`);
                
                // 如果是登录API，保存token
                if (test.name === '登录API' && data.code === 0) {
                    token = data.data.access_token;
                    console.log(`   用户: ${data.data.user.username}`);
                    console.log(`   Token: ${token.substring(0, 20)}...`);
                }
                
                // 显示部分响应数据
                if (data.count !== undefined) {
                    console.log(`   数据量: ${data.count}`);
                } else if (Array.isArray(data)) {
                    console.log(`   数据量: ${data.length}`);
                }
            } else {
                console.log(`❌ ${test.name} 失败: ${response.status}`);
                console.log(`   错误: ${data.message || data.detail || '未知错误'}`);
            }
            
        } catch (error) {
            console.log(`❌ ${test.name} 异常: ${error.message}`);
        }
        
        console.log(''); // 空行分隔
    }
}

// 运行测试
testFrontendProxy().then(() => {
    console.log('🎉 前端API代理测试完成!');
}).catch(error => {
    console.error('💥 测试异常:', error);
});