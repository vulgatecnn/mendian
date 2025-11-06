@echo off
chcp 65001
echo 生成测试数据...
python manage.py shell < scripts\generate_simple_test_data.py
pause
