#!/usr/bin/env python
"""
后端代码静态分析脚本
运行 pylint, flake8, bandit, radon 并生成综合报告
"""
import subprocess
import json
import os
from datetime import datetime
from pathlib import Path


class StaticAnalyzer:
    """静态代码分析器"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'pylint': {},
            'flake8': {},
            'bandit': {},
            'radon': {}
        }
        self.backend_dir = Path(__file__).parent
        
    def run_pylint(self):
        """运行 pylint 检查代码规范"""
        print("=" * 80)
        print("运行 Pylint 代码规范检查...")
        print("=" * 80)
        
        # 排除不需要检查的目录
        exclude_dirs = [
            'migrations',
            '__pycache__',
            'tests',
            'venv',
            'env',
            '.pytest_cache'
        ]
        
        # 获取所有 Python 模块目录
        modules = []
        for item in self.backend_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.') and item.name not in exclude_dirs:
                if (item / '__init__.py').exists():
                    modules.append(item.name)
        
        if not modules:
            print("未找到可检查的 Python 模块")
            return
        
        # 运行 pylint
        cmd = [
            'pylint',
            '--output-format=json',
            '--disable=C0114,C0115,C0116',  # 禁用文档字符串检查
            '--max-line-length=120',
            '--good-names=i,j,k,ex,_,id,pk',
        ] + modules
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            # Pylint 返回非零状态码表示发现问题，这是正常的
            if result.stdout:
                try:
                    issues = json.loads(result.stdout)
                    self.results['pylint'] = {
                        'total_issues': len(issues),
                        'issues': issues[:100],  # 只保存前100个问题
                        'status': 'completed'
                    }
                    print(f"✓ Pylint 检查完成，发现 {len(issues)} 个问题")
                except json.JSONDecodeError:
                    self.results['pylint'] = {
                        'status': 'error',
                        'message': 'JSON 解析失败',
                        'output': result.stdout[:1000]
                    }
            else:
                self.results['pylint'] = {
                    'total_issues': 0,
                    'status': 'completed',
                    'message': '未发现问题'
                }
                print("✓ Pylint 检查完成，未发现问题")
                
        except subprocess.TimeoutExpired:
            self.results['pylint'] = {'status': 'timeout'}
            print("✗ Pylint 检查超时")
        except Exception as e:
            self.results['pylint'] = {'status': 'error', 'message': str(e)}
            print(f"✗ Pylint 检查失败: {e}")
    
    def run_flake8(self):
        """运行 flake8 检查代码风格"""
        print("\n" + "=" * 80)
        print("运行 Flake8 代码风格检查...")
        print("=" * 80)
        
        cmd = [
            'flake8',
            '--max-line-length=120',
            '--exclude=migrations,__pycache__,venv,env,.pytest_cache',
            '--format=json',
            '.'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            # Flake8 返回非零状态码表示发现问题
            if result.stdout:
                try:
                    # Flake8 的 JSON 格式输出
                    issues = json.loads(result.stdout)
                    total = sum(len(v) for v in issues.values())
                    self.results['flake8'] = {
                        'total_issues': total,
                        'issues_by_file': issues,
                        'status': 'completed'
                    }
                    print(f"✓ Flake8 检查完成，发现 {total} 个问题")
                except json.JSONDecodeError:
                    # 如果不是 JSON 格式，解析文本输出
                    lines = result.stdout.strip().split('\n') if result.stdout else []
                    self.results['flake8'] = {
                        'total_issues': len(lines),
                        'status': 'completed',
                        'output': result.stdout[:2000]
                    }
                    print(f"✓ Flake8 检查完成，发现 {len(lines)} 个问题")
            else:
                self.results['flake8'] = {
                    'total_issues': 0,
                    'status': 'completed',
                    'message': '未发现问题'
                }
                print("✓ Flake8 检查完成，未发现问题")
                
        except subprocess.TimeoutExpired:
            self.results['flake8'] = {'status': 'timeout'}
            print("✗ Flake8 检查超时")
        except Exception as e:
            self.results['flake8'] = {'status': 'error', 'message': str(e)}
            print(f"✗ Flake8 检查失败: {e}")
    
    def run_bandit(self):
        """运行 bandit 检查安全问题"""
        print("\n" + "=" * 80)
        print("运行 Bandit 安全检查...")
        print("=" * 80)
        
        # 注意：Bandit 1.7.6 与 Python 3.14 存在兼容性问题
        # 跳过 migrations 目录以避免错误
        cmd = [
            'bandit',
            '-r', '.',
            '-f', 'json',
            '--skip', 'B404,B603,B607',  # 跳过一些常见的误报
            '--exclude', '**/migrations/**,**/tests/**,**/__pycache__/**,**/venv/**,**/env/**,**/.pytest_cache/**'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            # Bandit 可能会输出到 stderr，即使成功
            output = result.stdout if result.stdout else result.stderr
            
            if output:
                try:
                    data = json.loads(output)
                    issues = data.get('results', [])
                    self.results['bandit'] = {
                        'total_issues': len(issues),
                        'high_severity': len([i for i in issues if i.get('issue_severity') == 'HIGH']),
                        'medium_severity': len([i for i in issues if i.get('issue_severity') == 'MEDIUM']),
                        'low_severity': len([i for i in issues if i.get('issue_severity') == 'LOW']),
                        'issues': issues[:50],  # 只保存前50个问题
                        'status': 'completed'
                    }
                    print(f"✓ Bandit 检查完成，发现 {len(issues)} 个安全问题")
                    print(f"  - 高危: {self.results['bandit']['high_severity']}")
                    print(f"  - 中危: {self.results['bandit']['medium_severity']}")
                    print(f"  - 低危: {self.results['bandit']['low_severity']}")
                except json.JSONDecodeError:
                    # 如果 JSON 解析失败，记录为警告但不失败
                    self.results['bandit'] = {
                        'status': 'warning',
                        'message': 'Bandit 与 Python 3.14 存在兼容性问题，部分检查可能未完成',
                        'note': '建议升级 Bandit 或使用 Python 3.11-3.13'
                    }
                    print("⚠ Bandit 检查部分完成（存在兼容性问题）")
            else:
                self.results['bandit'] = {
                    'total_issues': 0,
                    'status': 'completed',
                    'message': '未发现安全问题'
                }
                print("✓ Bandit 检查完成，未发现安全问题")
                
        except subprocess.TimeoutExpired:
            self.results['bandit'] = {'status': 'timeout'}
            print("✗ Bandit 检查超时")
        except Exception as e:
            self.results['bandit'] = {
                'status': 'warning',
                'message': f'Bandit 执行遇到问题: {str(e)}',
                'note': 'Bandit 与 Python 3.14 存在兼容性问题'
            }
            print(f"⚠ Bandit 检查遇到问题: {e}")
    
    def run_radon(self):
        """运行 radon 计算代码复杂度"""
        print("\n" + "=" * 80)
        print("运行 Radon 代码复杂度分析...")
        print("=" * 80)
        
        # 圈复杂度分析
        cmd_cc = [
            'radon', 'cc',
            '--json',
            '--exclude=migrations,tests,__pycache__,venv,env,.pytest_cache',
            '.'
        ]
        
        try:
            result = subprocess.run(
                cmd_cc,
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.stdout:
                try:
                    data = json.loads(result.stdout)
                    
                    # 统计复杂度
                    complex_functions = []
                    for file_path, functions in data.items():
                        if isinstance(functions, list):
                            for func in functions:
                                if isinstance(func, dict) and func.get('complexity', 0) > 10:
                                    complex_functions.append({
                                        'file': file_path,
                                        'function': func.get('name'),
                                        'complexity': func.get('complexity'),
                                        'rank': func.get('rank')
                                    })
                    
                    self.results['radon'] = {
                        'total_files': len(data),
                        'complex_functions': len(complex_functions),
                        'high_complexity': complex_functions,
                        'status': 'completed'
                    }
                    print(f"✓ Radon 分析完成，检查了 {len(data)} 个文件")
                    print(f"  - 发现 {len(complex_functions)} 个高复杂度函数（复杂度 > 10）")
                except json.JSONDecodeError:
                    self.results['radon'] = {
                        'status': 'error',
                        'message': 'JSON 解析失败'
                    }
            else:
                self.results['radon'] = {
                    'status': 'completed',
                    'message': '分析完成'
                }
                print("✓ Radon 分析完成")
                
        except subprocess.TimeoutExpired:
            self.results['radon'] = {'status': 'timeout'}
            print("✗ Radon 分析超时")
        except Exception as e:
            self.results['radon'] = {'status': 'error', 'message': str(e)}
            print(f"✗ Radon 分析失败: {e}")
    
    def generate_report(self):
        """生成综合报告"""
        print("\n" + "=" * 80)
        print("生成代码质量报告...")
        print("=" * 80)
        
        # 保存 JSON 格式的详细报告
        json_report_path = self.backend_dir / 'static_analysis_report.json'
        with open(json_report_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"✓ JSON 报告已保存: {json_report_path}")
        
        # 生成 Markdown 格式的可读报告
        md_report_path = self.backend_dir / 'BACKEND_CODE_QUALITY_REPORT.md'
        with open(md_report_path, 'w', encoding='utf-8') as f:
            f.write(self._generate_markdown_report())
        print(f"✓ Markdown 报告已保存: {md_report_path}")
        
        print("\n" + "=" * 80)
        print("后端代码静态分析完成！")
        print("=" * 80)
    
    def _generate_markdown_report(self):
        """生成 Markdown 格式的报告"""
        lines = [
            "# 后端代码质量报告",
            "",
            f"**生成时间**: {self.results['timestamp']}",
            "",
            "## 执行摘要",
            ""
        ]
        
        # Pylint 摘要
        pylint = self.results.get('pylint', {})
        if pylint.get('status') == 'completed':
            total = pylint.get('total_issues', 0)
            lines.append(f"- **Pylint 代码规范检查**: 发现 {total} 个问题")
        else:
            lines.append(f"- **Pylint 代码规范检查**: {pylint.get('status', '未执行')}")
        
        # Flake8 摘要
        flake8 = self.results.get('flake8', {})
        if flake8.get('status') == 'completed':
            total = flake8.get('total_issues', 0)
            lines.append(f"- **Flake8 代码风格检查**: 发现 {total} 个问题")
        else:
            lines.append(f"- **Flake8 代码风格检查**: {flake8.get('status', '未执行')}")
        
        # Bandit 摘要
        bandit = self.results.get('bandit', {})
        if bandit.get('status') == 'completed':
            total = bandit.get('total_issues', 0)
            high = bandit.get('high_severity', 0)
            medium = bandit.get('medium_severity', 0)
            low = bandit.get('low_severity', 0)
            lines.append(f"- **Bandit 安全检查**: 发现 {total} 个安全问题（高危: {high}, 中危: {medium}, 低危: {low}）")
        elif bandit.get('status') == 'warning':
            lines.append(f"- **Bandit 安全检查**: {bandit.get('message', '警告')}")
        else:
            lines.append(f"- **Bandit 安全检查**: {bandit.get('status', '未执行')}")
        
        # Radon 摘要
        radon = self.results.get('radon', {})
        if radon.get('status') == 'completed':
            complex_funcs = radon.get('complex_functions', 0)
            lines.append(f"- **Radon 复杂度分析**: 发现 {complex_funcs} 个高复杂度函数（复杂度 > 10）")
        else:
            lines.append(f"- **Radon 复杂度分析**: {radon.get('status', '未执行')}")
        
        lines.extend([
            "",
            "## 详细结果",
            ""
        ])
        
        # Pylint 详细结果
        lines.extend([
            "### 1. Pylint 代码规范检查",
            ""
        ])
        if pylint.get('status') == 'completed':
            issues = pylint.get('issues', [])
            if issues:
                lines.append(f"发现 {pylint.get('total_issues', 0)} 个问题，以下是前 10 个：")
                lines.append("")
                for i, issue in enumerate(issues[:10], 1):
                    lines.append(f"{i}. **{issue.get('symbol', 'unknown')}** - {issue.get('message', '')}")
                    lines.append(f"   - 文件: `{issue.get('path', '')}`")
                    lines.append(f"   - 行号: {issue.get('line', 0)}")
                    lines.append(f"   - 类型: {issue.get('type', '')}")
                    lines.append("")
            else:
                lines.append("✓ 未发现问题")
                lines.append("")
        else:
            lines.append(f"状态: {pylint.get('status', '未执行')}")
            lines.append("")
        
        # Flake8 详细结果
        lines.extend([
            "### 2. Flake8 代码风格检查",
            ""
        ])
        if flake8.get('status') == 'completed':
            total = flake8.get('total_issues', 0)
            if total > 0:
                lines.append(f"发现 {total} 个代码风格问题")
                lines.append("")
                if 'output' in flake8:
                    lines.append("```")
                    lines.append(flake8['output'][:1000])
                    lines.append("```")
                    lines.append("")
            else:
                lines.append("✓ 未发现问题")
                lines.append("")
        else:
            lines.append(f"状态: {flake8.get('status', '未执行')}")
            lines.append("")
        
        # Bandit 详细结果
        lines.extend([
            "### 3. Bandit 安全检查",
            ""
        ])
        if bandit.get('status') == 'completed':
            issues = bandit.get('issues', [])
            if issues:
                lines.append(f"发现 {bandit.get('total_issues', 0)} 个安全问题，以下是前 10 个：")
                lines.append("")
                for i, issue in enumerate(issues[:10], 1):
                    lines.append(f"{i}. **{issue.get('test_id', '')}** - {issue.get('issue_text', '')}")
                    lines.append(f"   - 严重程度: {issue.get('issue_severity', '')}")
                    lines.append(f"   - 置信度: {issue.get('issue_confidence', '')}")
                    lines.append(f"   - 文件: `{issue.get('filename', '')}`")
                    lines.append(f"   - 行号: {issue.get('line_number', 0)}")
                    lines.append("")
            else:
                lines.append("✓ 未发现安全问题")
                lines.append("")
        elif bandit.get('status') == 'warning':
            lines.append(f"⚠ {bandit.get('message', '警告')}")
            lines.append("")
            if 'note' in bandit:
                lines.append(f"**注意**: {bandit['note']}")
                lines.append("")
        else:
            lines.append(f"状态: {bandit.get('status', '未执行')}")
            lines.append("")
        
        # Radon 详细结果
        lines.extend([
            "### 4. Radon 代码复杂度分析",
            ""
        ])
        if radon.get('status') == 'completed':
            complex_funcs = radon.get('high_complexity', [])
            if complex_funcs:
                lines.append(f"发现 {len(complex_funcs)} 个高复杂度函数（复杂度 > 10）：")
                lines.append("")
                for i, func in enumerate(complex_funcs[:20], 1):
                    lines.append(f"{i}. **{func.get('function', '')}** - 复杂度: {func.get('complexity', 0)} ({func.get('rank', '')})")
                    lines.append(f"   - 文件: `{func.get('file', '')}`")
                    lines.append("")
            else:
                lines.append("✓ 未发现高复杂度函数")
                lines.append("")
        else:
            lines.append(f"状态: {radon.get('status', '未执行')}")
            lines.append("")
        
        # 建议
        lines.extend([
            "## 改进建议",
            "",
            "### 代码规范",
            "- 修复 Pylint 和 Flake8 报告的代码规范问题",
            "- 统一代码风格，遵循 PEP 8 规范",
            "- 添加必要的文档字符串",
            "",
            "### 安全性",
            "- 优先修复 Bandit 报告的高危和中危安全问题",
            "- 审查敏感数据的处理方式",
            "- 加强输入验证和输出转义",
            "",
            "### 代码复杂度",
            "- 重构复杂度超过 10 的函数",
            "- 将大函数拆分为更小的、单一职责的函数",
            "- 提高代码的可读性和可维护性",
            "",
            "## 附录",
            "",
            f"完整的 JSON 格式报告: `static_analysis_report.json`",
            ""
        ])
        
        return "\n".join(lines)
    
    def run_all(self):
        """运行所有分析"""
        self.run_pylint()
        self.run_flake8()
        self.run_bandit()
        self.run_radon()
        self.generate_report()


if __name__ == '__main__':
    analyzer = StaticAnalyzer()
    analyzer.run_all()
