# 前后端连接测试脚本
Write-Host "🔍 开始前后端连接测试..." -ForegroundColor Cyan
Write-Host ""

$backendUrl = "http://localhost:8000"
$frontendUrl = "http://localhost:5000"

# 测试1: 后端服务器状态
Write-Host "测试1: 后端服务器状态" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/admin/" -Method Head -TimeoutSec 5
    Write-Host "✅ 后端服务器状态: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务器连接失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试2: 前端服务器状态
Write-Host "测试2: 前端服务器状态" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method Head -TimeoutSec 5
    Write-Host "✅ 前端服务器状态: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端服务器连接失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试3: API文档访问
Write-Host "测试3: API文档访问" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/docs/" -Method Head -TimeoutSec 5
    Write-Host "✅ API文档访问状态: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ API文档访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: OpenAPI Schema
Write-Host "测试4: OpenAPI Schema" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/schema/" -Method Head -TimeoutSec 5
    Write-Host "✅ OpenAPI Schema状态: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenAPI Schema访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试5: API权限验证
Write-Host "测试5: API权限验证" -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $frontendUrl
    }
    $response = Invoke-WebRequest -Uri "$backendUrl/api/permissions/" -Headers $headers -Method Get -TimeoutSec 5
    Write-Host "✅ API权限验证状态: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ API权限验证状态: 403 (正常，表示需要认证)" -ForegroundColor Green
    } else {
        Write-Host "❌ API权限验证失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 前后端连接测试完成！" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 测试总结:" -ForegroundColor White
Write-Host "- 后端服务: $backendUrl" -ForegroundColor Gray
Write-Host "- 前端服务: $frontendUrl" -ForegroundColor Gray
Write-Host "- API文档: $backendUrl/api/docs/" -ForegroundColor Gray
Write-Host "- 管理后台: $backendUrl/admin/ (用户名: admin, 密码: admin123)" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 现在可以在浏览器中访问以下地址进行测试:" -ForegroundColor Cyan
Write-Host "1. 前端应用: $frontendUrl" -ForegroundColor White
Write-Host "2. API文档: $backendUrl/api/docs/" -ForegroundColor White
Write-Host "3. 管理后台: $backendUrl/admin/" -ForegroundColor White
