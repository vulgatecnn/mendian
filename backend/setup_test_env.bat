@echo off
REM 测试环境准备脚本（Windows）
echo ====================================
echo 准备测试环境
echo ====================================

REM 设置测试环境变量
set ENV_FILE=.env.test

REM 运行测试环境准备脚本
python setup_test_env.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 测试环境准备失败
    exit /b 1
)

echo.
echo 测试环境准备完成
