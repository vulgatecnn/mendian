@echo off
chcp 65001
echo ========================================
echo 门店生命周期管理系统 - 快速测试
echo ========================================
echo.

echo [1/5] 检查后端服务...
curl -s http://localhost:8000/api/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 后端服务运行正常
) else (
    echo ✗ 后端服务未运行，请先启动: cd backend ^&^& python manage.py runserver
    goto :end
)

echo [2/5] 检查前端服务...
curl -s http://localhost:5000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 前端服务运行正常
) else (
    echo ✗ 前端服务未运行，请先启动: cd frontend ^&^& pnpm dev
    goto :end
)

echo [3/5] 测试登录 API...
curl -X POST http://localhost:8000/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"login_type\":\"username_password\",\"username\":\"admin\",\"password\":\"admin123\"}" ^
  -s -o test_login_response.json
findstr /C:"access_token" test_login_response.json >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 登录 API 测试通过
    del test_login_response.json
) else (
    echo ✗ 登录 API 测试失败
    type test_login_response.json
    del test_login_response.json
    goto :end
)

echo [4/5] 检查数据库数据...
cd backend
python manage.py shell -c "from system_management.models import User; print(f'用户数: {User.objects.count()}')" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 数据库连接正常
) else (
    echo ✗ 数据库连接失败
)
cd ..

echo [5/5] 打开浏览器测试...
echo.
echo ========================================
echo 测试完成！
echo ========================================
echo.
echo 请在浏览器中测试以下功能：
echo.
echo PC 端登录: http://localhost:5000/pc
echo   用户名: admin
echo   密码: admin123
echo.
echo 移动端登录: http://localhost:5000/mobile
echo.
echo API 文档: http://localhost:8000/api/docs/
echo.
start http://localhost:5000/pc

:end
pause
