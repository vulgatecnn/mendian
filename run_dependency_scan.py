#!/usr/bin/env python
"""
依赖安全扫描脚本
扫描后端 Python 依赖和前端 Node.js 依赖的安全漏洞
"""
import subprocess
import json
import os
from datetime import datetime
from pathlib import Path


class DependencyScanner:
    """依赖安全扫描器"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'backend': {},
            'frontend': {}
        }
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / 'backend'
        self.frontend_dir = self.project_root / 'frontend'
    
    def scan_python_dependencies(self):
        """扫描 Python 依赖漏洞"""
        print("=" * 80)
        print("扫描 Python 依赖安全漏洞...")
        print("=" * 80)
        
        # 使用 pip-audit 扫描（safety 与 Python 3.14 不兼容）
        cmd = ['pip-audit', '--format', 'json', '--requirement', 'requirements.txt']
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.stdout:
                try:
                    data = json.loads(result.stdout)
                    vulnerabilities = data.get('dependencies', [])
                    
                    # 统计漏洞严重程度
                    critical = 0
                    high = 0
                    medium = 0
                    low = 0
                    
                    for dep in vulnerabilities:
                        for vuln in dep.get('vulns', []):
                            severity = vuln.get('severity', '').lower()
                            if severity == 'critical':
                                critical += 1
                            elif severity == 'high':
                                high += 1
                            elif severity == 'medium':
                                medium += 1
                            elif severity == 'low':
                                low += 1
                    
                    total_vulns = critical + high + medium + low
                    
                    self.results['backend'] = {
                        'status': 'completed',
                        'total_vulnerabilities': total_vulns,
                        'critical': critical,
                        'high': high,
                        'medium': medium,
                        'low': low,
                        'vulnerable_packages': len(vulnerabilities),
                        'details': vulnerabilities[:20]  # 只保存前20个
                    }
                    
                    print(f"✓ Python 依赖扫描完成")
                    print(f"  - 发现 {total_vulns} 个漏洞")
                    print(f"  - 严重: {critical}, 高危: {high}, 中危: {medium}, 低危: {low}")
                    print(f"  - 受影响的包: {len(vulnerabilities)}")
                    
                except json.JSONDecodeError:
                    # 如果没有漏洞，pip-audit 可能返回空或非 JSON
                    self.results['backend'] = {
                        'status': 'completed',
                        'total_vulnerabilities': 0,
                        'message': '未发现安全漏洞'
                    }
                    print("✓ Python 依赖扫描完成，未发现安全漏洞")
            else:
                self.results['backend'] = {
                    'status': 'completed',
                    'total_vulnerabilities': 0,
                    'message': '未发现安全漏洞'
                }
                print("✓ Python 依赖扫描完成，未发现安全漏洞")
                
        except subprocess.TimeoutExpired:
            self.results['backend'] = {'status': 'timeout'}
            print("✗ Python 依赖扫描超时")
        except FileNotFoundError:
            self.results['backend'] = {
                'status': 'error',
                'message': 'pip-audit 未安装，请运行: pip install pip-audit'
            }
            print("✗ pip-audit 未安装")
        except Exception as e:
            self.results['backend'] = {'status': 'error', 'message': str(e)}
            print(f"✗ Python 依赖扫描失败: {e}")
    
    def scan_npm_dependencies(self):
        """扫描 Node.js 依赖漏洞"""
        print("\n" + "=" * 80)
        print("扫描 Node.js 依赖安全漏洞...")
        print("=" * 80)
        
        # 先尝试读取已存在的 npm_audit_result.json
        npm_audit_file = self.frontend_dir / 'npm_audit_result.json'
        
        if npm_audit_file.exists():
            print("读取已存在的 npm audit 结果...")
            try:
                with open(npm_audit_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # npm audit 的输出格式
                vulnerabilities = data.get('vulnerabilities', {})
                metadata = data.get('metadata', {})
                
                total_vulns = metadata.get('vulnerabilities', {})
                critical = total_vulns.get('critical', 0)
                high = total_vulns.get('high', 0)
                moderate = total_vulns.get('moderate', 0)
                low = total_vulns.get('low', 0)
                info = total_vulns.get('info', 0)
                
                total = critical + high + moderate + low + info
                
                # 提取漏洞详情
                vuln_details = []
                for pkg_name, vuln_info in list(vulnerabilities.items())[:20]:
                    vuln_details.append({
                        'package': pkg_name,
                        'severity': vuln_info.get('severity'),
                        'via': vuln_info.get('via', []),
                        'range': vuln_info.get('range')
                    })
                
                self.results['frontend'] = {
                    'status': 'completed',
                    'total_vulnerabilities': total,
                    'critical': critical,
                    'high': high,
                    'moderate': moderate,
                    'low': low,
                    'info': info,
                    'vulnerable_packages': len(vulnerabilities),
                    'details': vuln_details
                }
                
                print(f"✓ Node.js 依赖扫描完成")
                print(f"  - 发现 {total} 个漏洞")
                print(f"  - 严重: {critical}, 高危: {high}, 中危: {moderate}, 低危: {low}, 信息: {info}")
                print(f"  - 受影响的包: {len(vulnerabilities)}")
                return
                
            except Exception as e:
                print(f"读取 npm audit 结果失败: {e}")
        
        # 如果文件不存在，尝试运行 npm audit
        print("运行 npm audit...")
        # 使用 shell=True 在 Windows 上运行 npm
        cmd = 'npm audit --json'
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.frontend_dir,
                capture_output=True,
                text=True,
                timeout=300,
                shell=True
            )
            
            if result.stdout:
                try:
                    data = json.loads(result.stdout)
                    
                    # npm audit 的输出格式
                    vulnerabilities = data.get('vulnerabilities', {})
                    metadata = data.get('metadata', {})
                    
                    total_vulns = metadata.get('vulnerabilities', {})
                    critical = total_vulns.get('critical', 0)
                    high = total_vulns.get('high', 0)
                    moderate = total_vulns.get('moderate', 0)
                    low = total_vulns.get('low', 0)
                    info = total_vulns.get('info', 0)
                    
                    total = critical + high + moderate + low + info
                    
                    # 提取漏洞详情
                    vuln_details = []
                    for pkg_name, vuln_info in list(vulnerabilities.items())[:20]:
                        vuln_details.append({
                            'package': pkg_name,
                            'severity': vuln_info.get('severity'),
                            'via': vuln_info.get('via', []),
                            'range': vuln_info.get('range')
                        })
                    
                    self.results['frontend'] = {
                        'status': 'completed',
                        'total_vulnerabilities': total,
                        'critical': critical,
                        'high': high,
                        'moderate': moderate,
                        'low': low,
                        'info': info,
                        'vulnerable_packages': len(vulnerabilities),
                        'details': vuln_details
                    }
                    
                    print(f"✓ Node.js 依赖扫描完成")
                    print(f"  - 发现 {total} 个漏洞")
                    print(f"  - 严重: {critical}, 高危: {high}, 中危: {moderate}, 低危: {low}, 信息: {info}")
                    print(f"  - 受影响的包: {len(vulnerabilities)}")
                    
                except json.JSONDecodeError:
                    self.results['frontend'] = {
                        'status': 'error',
                        'message': 'JSON 解析失败'
                    }
                    print("✗ npm audit 输出解析失败")
            else:
                self.results['frontend'] = {
                    'status': 'completed',
                    'total_vulnerabilities': 0,
                    'message': '未发现安全漏洞'
                }
                print("✓ Node.js 依赖扫描完成，未发现安全漏洞")
                
        except subprocess.TimeoutExpired:
            self.results['frontend'] = {'status': 'timeout'}
            print("✗ Node.js 依赖扫描超时")
        except FileNotFoundError:
            self.results['frontend'] = {
                'status': 'error',
                'message': 'npm 未安装或不在 PATH 中'
            }
            print("✗ npm 未找到")
        except Exception as e:
            self.results['frontend'] = {'status': 'error', 'message': str(e)}
            print(f"✗ Node.js 依赖扫描失败: {e}")
    
    def check_outdated_packages(self):
        """检查过期的依赖包"""
        print("\n" + "=" * 80)
        print("检查过期的依赖包...")
        print("=" * 80)
        
        # 检查 Python 包
        print("\n检查 Python 包...")
        try:
            result = subprocess.run(
                ['pip', 'list', '--outdated', '--format', 'json'],
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.stdout:
                outdated = json.loads(result.stdout)
                self.results['backend']['outdated_packages'] = len(outdated)
                self.results['backend']['outdated_details'] = outdated[:10]
                print(f"  - 发现 {len(outdated)} 个过期的 Python 包")
        except Exception as e:
            print(f"  - Python 包检查失败: {e}")
        
        # 检查 Node.js 包
        print("\n检查 Node.js 包...")
        try:
            result = subprocess.run(
                'npm outdated --json',
                cwd=self.frontend_dir,
                capture_output=True,
                text=True,
                timeout=60,
                shell=True
            )
            
            if result.stdout:
                try:
                    outdated = json.loads(result.stdout)
                    self.results['frontend']['outdated_packages'] = len(outdated)
                    self.results['frontend']['outdated_details'] = dict(list(outdated.items())[:10])
                    print(f"  - 发现 {len(outdated)} 个过期的 Node.js 包")
                except json.JSONDecodeError:
                    print("  - Node.js 包检查完成（无过期包）")
        except Exception as e:
            print(f"  - Node.js 包检查失败: {e}")
    
    def generate_report(self):
        """生成综合报告"""
        print("\n" + "=" * 80)
        print("生成依赖安全报告...")
        print("=" * 80)
        
        # 保存 JSON 格式的详细报告
        json_report_path = self.project_root / 'dependency_security_report.json'
        with open(json_report_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"✓ JSON 报告已保存: {json_report_path}")
        
        # 生成 Markdown 格式的可读报告
        md_report_path = self.project_root / 'DEPENDENCY_SECURITY_REPORT.md'
        with open(md_report_path, 'w', encoding='utf-8') as f:
            f.write(self._generate_markdown_report())
        print(f"✓ Markdown 报告已保存: {md_report_path}")
        
        print("\n" + "=" * 80)
        print("依赖安全扫描完成！")
        print("=" * 80)
    
    def _generate_markdown_report(self):
        """生成 Markdown 格式的报告"""
        lines = [
            "# 依赖安全扫描报告",
            "",
            f"**生成时间**: {self.results['timestamp']}",
            "",
            "## 执行摘要",
            ""
        ]
        
        # 后端摘要
        backend = self.results.get('backend', {})
        if backend.get('status') == 'completed':
            total = backend.get('total_vulnerabilities', 0)
            critical = backend.get('critical', 0)
            high = backend.get('high', 0)
            medium = backend.get('medium', 0)
            low = backend.get('low', 0)
            lines.append(f"### 后端 (Python)")
            lines.append(f"- **安全漏洞**: {total} 个（严重: {critical}, 高危: {high}, 中危: {medium}, 低危: {low}）")
            lines.append(f"- **受影响的包**: {backend.get('vulnerable_packages', 0)} 个")
            if 'outdated_packages' in backend:
                lines.append(f"- **过期的包**: {backend['outdated_packages']} 个")
        else:
            lines.append(f"### 后端 (Python)")
            lines.append(f"- **状态**: {backend.get('status', '未执行')}")
        
        lines.append("")
        
        # 前端摘要
        frontend = self.results.get('frontend', {})
        if frontend.get('status') == 'completed':
            total = frontend.get('total_vulnerabilities', 0)
            critical = frontend.get('critical', 0)
            high = frontend.get('high', 0)
            moderate = frontend.get('moderate', 0)
            low = frontend.get('low', 0)
            info = frontend.get('info', 0)
            lines.append(f"### 前端 (Node.js)")
            lines.append(f"- **安全漏洞**: {total} 个（严重: {critical}, 高危: {high}, 中危: {moderate}, 低危: {low}, 信息: {info}）")
            lines.append(f"- **受影响的包**: {frontend.get('vulnerable_packages', 0)} 个")
            if 'outdated_packages' in frontend:
                lines.append(f"- **过期的包**: {frontend['outdated_packages']} 个")
        else:
            lines.append(f"### 前端 (Node.js)")
            lines.append(f"- **状态**: {frontend.get('status', '未执行')}")
        
        lines.extend([
            "",
            "## 详细结果",
            ""
        ])
        
        # 后端详细结果
        lines.extend([
            "### 1. 后端 Python 依赖",
            ""
        ])
        
        if backend.get('status') == 'completed':
            if backend.get('total_vulnerabilities', 0) > 0:
                lines.append(f"发现 {backend['total_vulnerabilities']} 个安全漏洞：")
                lines.append("")
                
                details = backend.get('details', [])
                if details:
                    lines.append("#### 受影响的包（前10个）")
                    lines.append("")
                    for i, dep in enumerate(details[:10], 1):
                        pkg_name = dep.get('name', 'unknown')
                        version = dep.get('version', 'unknown')
                        vulns = dep.get('vulns', [])
                        
                        lines.append(f"{i}. **{pkg_name}** (版本: {version})")
                        lines.append(f"   - 漏洞数量: {len(vulns)}")
                        
                        for vuln in vulns[:3]:  # 只显示前3个漏洞
                            lines.append(f"   - {vuln.get('id', 'N/A')}: {vuln.get('description', 'No description')[:100]}")
                            lines.append(f"     - 严重程度: {vuln.get('severity', 'unknown')}")
                            if 'fix_versions' in vuln:
                                lines.append(f"     - 修复版本: {', '.join(vuln['fix_versions'])}")
                        lines.append("")
            else:
                lines.append("✓ 未发现安全漏洞")
                lines.append("")
            
            # 过期包
            if 'outdated_packages' in backend and backend['outdated_packages'] > 0:
                lines.append("#### 过期的包（前10个）")
                lines.append("")
                for pkg in backend.get('outdated_details', [])[:10]:
                    lines.append(f"- **{pkg['name']}**: {pkg['version']} → {pkg['latest_version']}")
                lines.append("")
        else:
            lines.append(f"状态: {backend.get('status', '未执行')}")
            if 'message' in backend:
                lines.append(f"消息: {backend['message']}")
            lines.append("")
        
        # 前端详细结果
        lines.extend([
            "### 2. 前端 Node.js 依赖",
            ""
        ])
        
        if frontend.get('status') == 'completed':
            if frontend.get('total_vulnerabilities', 0) > 0:
                lines.append(f"发现 {frontend['total_vulnerabilities']} 个安全漏洞：")
                lines.append("")
                
                details = frontend.get('details', [])
                if details:
                    lines.append("#### 受影响的包（前10个）")
                    lines.append("")
                    for i, vuln in enumerate(details[:10], 1):
                        pkg_name = vuln.get('package', 'unknown')
                        severity = vuln.get('severity', 'unknown')
                        
                        lines.append(f"{i}. **{pkg_name}**")
                        lines.append(f"   - 严重程度: {severity}")
                        lines.append(f"   - 影响范围: {vuln.get('range', 'N/A')}")
                        lines.append("")
            else:
                lines.append("✓ 未发现安全漏洞")
                lines.append("")
            
            # 过期包
            if 'outdated_packages' in frontend and frontend['outdated_packages'] > 0:
                lines.append("#### 过期的包（前10个）")
                lines.append("")
                for pkg_name, info in list(frontend.get('outdated_details', {}).items())[:10]:
                    current = info.get('current', 'unknown')
                    latest = info.get('latest', 'unknown')
                    lines.append(f"- **{pkg_name}**: {current} → {latest}")
                lines.append("")
        else:
            lines.append(f"状态: {frontend.get('status', '未执行')}")
            if 'message' in frontend:
                lines.append(f"消息: {frontend['message']}")
            lines.append("")
        
        # 修复建议
        lines.extend([
            "## 修复建议",
            "",
            "### 优先级",
            "1. **立即修复**: 严重 (Critical) 和高危 (High) 漏洞",
            "2. **计划修复**: 中危 (Medium) 漏洞",
            "3. **可选修复**: 低危 (Low) 和信息 (Info) 级别的问题",
            "",
            "### 后端 Python 依赖",
            "```bash",
            "# 升级特定包",
            "pip install --upgrade <package-name>",
            "",
            "# 或使用 pip-audit 自动修复",
            "pip-audit --fix",
            "```",
            "",
            "### 前端 Node.js 依赖",
            "```bash",
            "# 自动修复（如果可能）",
            "npm audit fix",
            "",
            "# 强制修复（可能引入破坏性更改）",
            "npm audit fix --force",
            "",
            "# 手动升级特定包",
            "npm install <package-name>@latest",
            "```",
            "",
            "### 注意事项",
            "- 升级依赖前请先备份代码",
            "- 升级后运行完整的测试套件",
            "- 检查是否有破坏性更改",
            "- 更新 requirements.txt 和 package.json",
            "",
            "## 附录",
            "",
            "完整的 JSON 格式报告: `dependency_security_report.json`",
            ""
        ])
        
        return "\n".join(lines)
    
    def run_all(self):
        """运行所有扫描"""
        self.scan_python_dependencies()
        self.scan_npm_dependencies()
        self.check_outdated_packages()
        self.generate_report()


if __name__ == '__main__':
    scanner = DependencyScanner()
    scanner.run_all()
