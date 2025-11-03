#!/bin/bash
# 后端测试运行脚本

echo "🧪 开始运行测试..."
echo ""

# 检查是否安装了pytest
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest未安装，正在安装测试依赖..."
    pip install -r requirements.txt
fi

# 运行测试
case "$1" in
    "unit")
        echo "运行单元测试..."
        pytest -m unit -v
        ;;
    "integration")
        echo "运行集成测试..."
        pytest -m integration -v
        ;;
    "e2e")
        echo "运行端到端测试..."
        pytest -m e2e -v
        ;;
    "coverage")
        echo "运行测试并生成覆盖率报告..."
        pytest --cov=. --cov-report=html --cov-report=term
        echo ""
        echo "📊 覆盖率报告已生成到 htmlcov/index.html"
        ;;
    "fast")
        echo "快速运行测试（并行）..."
        pytest -n auto
        ;;
    *)
        echo "运行所有测试..."
        pytest -v
        ;;
esac

echo ""
echo "✅ 测试完成！"
