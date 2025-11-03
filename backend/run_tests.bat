@echo off
REM 后端测试运行脚本（Windows）

echo 🧪 开始运行测试...
echo.

REM 检查是否安装了pytest
where pytest >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pytest未安装，正在安装测试依赖...
    pip install -r requirements.txt
)

REM 运行测试
if "%1"=="unit" (
    echo 运行单元测试...
    pytest -m unit -v
) else if "%1"=="integration" (
    echo 运行集成测试...
    pytest -m integration -v
) else if "%1"=="e2e" (
    echo 运行端到端测试...
    pytest -m e2e -v
) else if "%1"=="coverage" (
    echo 运行测试并生成覆盖率报告...
    pytest --cov=. --cov-report=html --cov-report=term
    echo.
    echo 📊 覆盖率报告已生成到 htmlcov/index.html
) else if "%1"=="fast" (
    echo 快速运行测试（并行）...
    pytest -n auto
) else (
    echo 运行所有测试...
    pytest -v
)

echo.
echo ✅ 测试完成！
