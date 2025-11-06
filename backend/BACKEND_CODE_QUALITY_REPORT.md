# 后端代码质量报告

**生成时间**: 2025-11-04T20:39:37.725954

## 执行摘要

- **Pylint 代码规范检查**: 发现 9224 个问题
- **Flake8 代码风格检查**: 发现 8039 个问题
- **Bandit 安全检查**: Bandit 与 Python 3.14 存在兼容性问题，部分检查可能未完成
- **Radon 复杂度分析**: 发现 49 个高复杂度函数（复杂度 > 10）

## 详细结果

### 1. Pylint 代码规范检查

发现 9224 个问题，以下是前 10 个：

1. **syntax-error** - Parsing failed: 'invalid syntax (<unknown>, line 815)'
   - 文件: `data_analytics\tasks.py`
   - 行号: 815
   - 类型: error

2. **syntax-error** - Parsing failed: ''{' was never closed (<unknown>, line 36)'
   - 文件: `system_management\home_views.py`
   - 行号: 36
   - 类型: error

3. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 10
   - 类型: convention

4. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 16
   - 类型: convention

5. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 21
   - 类型: convention

6. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 24
   - 类型: convention

7. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 27
   - 类型: convention

8. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 30
   - 类型: convention

9. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 31
   - 类型: convention

10. **trailing-whitespace** - Trailing whitespace
   - 文件: `approval\models.py`
   - 行号: 32
   - 类型: convention

### 2. Flake8 代码风格检查

发现 8039 个代码风格问题

```
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json
json

```

### 3. Bandit 安全检查

⚠ Bandit 与 Python 3.14 存在兼容性问题，部分检查可能未完成

**注意**: 建议升级 Bandit 或使用 Python 3.11-3.13

### 4. Radon 代码复杂度分析

发现 49 个高复杂度函数（复杂度 > 10）：

1. **_generate_markdown_report** - 复杂度: 20 (C)
   - 文件: `run_static_analysis.py`

2. **run_bandit** - 复杂度: 12 (C)
   - 文件: `run_static_analysis.py`

3. **run_pylint** - 复杂度: 11 (C)
   - 文件: `run_static_analysis.py`

4. **_resolve_approvers** - 复杂度: 15 (C)
   - 文件: `approval\services\flow_engine.py`

5. **check_data_permission** - 复杂度: 13 (C)
   - 文件: `common\permissions.py`

6. **check_object_permission** - 复杂度: 11 (C)
   - 文件: `common\permissions.py`

7. **filter_data_by_permission** - 复杂度: 11 (C)
   - 文件: `data_analytics\permissions.py`

8. **validate_sales_data** - 复杂度: 41 (F)
   - 文件: `data_analytics\services.py`

9. **ExternalDataValidationService** - 复杂度: 17 (C)
   - 文件: `data_analytics\services.py`

10. **match_store** - 复杂度: 14 (C)
   - 文件: `data_analytics\services.py`

11. **refresh_cache** - 复杂度: 11 (C)
   - 文件: `data_analytics\services.py`

12. **validate_sales_data** - 复杂度: 17 (C)
   - 文件: `data_analytics\utils.py`

13. **DataCleaner** - 复杂度: 13 (C)
   - 文件: `data_analytics\utils.py`

14. **DataValidator** - 复杂度: 12 (C)
   - 文件: `data_analytics\utils.py`

15. **clean_store_data** - 复杂度: 12 (C)
   - 文件: `data_analytics\utils.py`

16. **clean_financial_data** - 复杂度: 12 (C)
   - 文件: `data_analytics\utils.py`

17. **validate_date_range** - 复杂度: 11 (C)
   - 文件: `data_analytics\utils.py`

18. **get** - 复杂度: 19 (C)
   - 文件: `data_analytics\views.py`

19. **DataSyncStatusView** - 复杂度: 12 (C)
   - 文件: `data_analytics\views.py`

20. **put** - 复杂度: 11 (C)
   - 文件: `data_analytics\views.py`

## 改进建议

### 代码规范
- 修复 Pylint 和 Flake8 报告的代码规范问题
- 统一代码风格，遵循 PEP 8 规范
- 添加必要的文档字符串

### 安全性
- 优先修复 Bandit 报告的高危和中危安全问题
- 审查敏感数据的处理方式
- 加强输入验证和输出转义

### 代码复杂度
- 重构复杂度超过 10 的函数
- 将大函数拆分为更小的、单一职责的函数
- 提高代码的可读性和可维护性

## 附录

完整的 JSON 格式报告: `static_analysis_report.json`
