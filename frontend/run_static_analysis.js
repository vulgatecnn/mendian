#!/usr/bin/env node
/**
 * 前端代码静态分析脚本
 * 运行 ESLint, TypeScript 编译器检查并生成综合报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FrontendStaticAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      eslint: {},
      typescript: {},
      unusedExports: {}
    };
    this.frontendDir = __dirname;
  }

  /**
   * 运行 ESLint 检查代码规范
   */
  runESLint() {
    console.log('='.repeat(80));
    console.log('运行 ESLint 代码规范检查...');
    console.log('='.repeat(80));

    try {
      // 运行 ESLint 并输出 JSON 格式
      const cmd = 'npx eslint src --ext .ts,.tsx --format json';
      
      try {
        const output = execSync(cmd, {
          cwd: this.frontendDir,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        const results = JSON.parse(output);
        const totalErrors = results.reduce((sum, file) => sum + file.errorCount, 0);
        const totalWarnings = results.reduce((sum, file) => sum + file.warningCount, 0);
        const filesWithIssues = results.filter(file => file.errorCount > 0 || file.warningCount > 0);

        this.results.eslint = {
          status: 'completed',
          totalFiles: results.length,
          filesWithIssues: filesWithIssues.length,
          totalErrors: totalErrors,
          totalWarnings: totalWarnings,
          issues: filesWithIssues.slice(0, 20) // 只保存前20个有问题的文件
        };

        console.log(`✓ ESLint 检查完成`);
        console.log(`  - 检查文件数: ${results.length}`);
        console.log(`  - 错误: ${totalErrors}`);
        console.log(`  - 警告: ${totalWarnings}`);
      } catch (error) {
        // ESLint 返回非零状态码表示发现问题
        if (error.stdout) {
          const results = JSON.parse(error.stdout);
          const totalErrors = results.reduce((sum, file) => sum + file.errorCount, 0);
          const totalWarnings = results.reduce((sum, file) => sum + file.warningCount, 0);
          const filesWithIssues = results.filter(file => file.errorCount > 0 || file.warningCount > 0);

          this.results.eslint = {
            status: 'completed',
            totalFiles: results.length,
            filesWithIssues: filesWithIssues.length,
            totalErrors: totalErrors,
            totalWarnings: totalWarnings,
            issues: filesWithIssues.slice(0, 20)
          };

          console.log(`✓ ESLint 检查完成`);
          console.log(`  - 检查文件数: ${results.length}`);
          console.log(`  - 错误: ${totalErrors}`);
          console.log(`  - 警告: ${totalWarnings}`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.results.eslint = {
        status: 'error',
        message: error.message
      };
      console.log(`✗ ESLint 检查失败: ${error.message}`);
    }
  }

  /**
   * 运行 TypeScript 编译器检查类型错误
   */
  runTypeScriptCheck() {
    console.log('\n' + '='.repeat(80));
    console.log('运行 TypeScript 类型检查...');
    console.log('='.repeat(80));

    try {
      // 运行 tsc --noEmit 只检查类型，不生成文件
      const cmd = 'npx tsc --noEmit --pretty false';
      
      try {
        execSync(cmd, {
          cwd: this.frontendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        this.results.typescript = {
          status: 'completed',
          errors: 0,
          message: '未发现类型错误'
        };

        console.log('✓ TypeScript 检查完成，未发现类型错误');
      } catch (error) {
        // TypeScript 返回非零状态码表示发现错误
        const output = error.stdout || error.stderr || '';
        const errorLines = output.split('\n').filter(line => line.includes('error TS'));
        
        this.results.typescript = {
          status: 'completed',
          errors: errorLines.length,
          output: output.substring(0, 5000), // 只保存前5000字符
          errorSummary: errorLines.slice(0, 20) // 只保存前20个错误
        };

        console.log(`✓ TypeScript 检查完成，发现 ${errorLines.length} 个类型错误`);
      }
    } catch (error) {
      this.results.typescript = {
        status: 'error',
        message: error.message
      };
      console.log(`✗ TypeScript 检查失败: ${error.message}`);
    }
  }

  /**
   * 检查未使用的导入和变量
   */
  checkUnusedCode() {
    console.log('\n' + '='.repeat(80));
    console.log('检查未使用的导入和变量...');
    console.log('='.repeat(80));

    try {
      // 使用 ESLint 的 no-unused-vars 规则
      const cmd = 'npx eslint src --ext .ts,.tsx --format json --rule "no-unused-vars: error" --rule "@typescript-eslint/no-unused-vars: error"';
      
      try {
        const output = execSync(cmd, {
          cwd: this.frontendDir,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        });

        this.results.unusedExports = {
          status: 'completed',
          issues: 0,
          message: '未发现未使用的代码'
        };

        console.log('✓ 未使用代码检查完成，未发现问题');
      } catch (error) {
        if (error.stdout) {
          const results = JSON.parse(error.stdout);
          const unusedIssues = results.flatMap(file => 
            file.messages.filter(msg => 
              msg.ruleId === 'no-unused-vars' || 
              msg.ruleId === '@typescript-eslint/no-unused-vars'
            )
          );

          this.results.unusedExports = {
            status: 'completed',
            issues: unusedIssues.length,
            details: unusedIssues.slice(0, 50) // 只保存前50个
          };

          console.log(`✓ 未使用代码检查完成，发现 ${unusedIssues.length} 个问题`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.results.unusedExports = {
        status: 'error',
        message: error.message
      };
      console.log(`✗ 未使用代码检查失败: ${error.message}`);
    }
  }

  /**
   * 生成综合报告
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('生成代码质量报告...');
    console.log('='.repeat(80));

    // 保存 JSON 格式的详细报告
    const jsonReportPath = path.join(this.frontendDir, 'static_analysis_report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf-8');
    console.log(`✓ JSON 报告已保存: ${jsonReportPath}`);

    // 生成 Markdown 格式的可读报告
    const mdReportPath = path.join(this.frontendDir, 'FRONTEND_CODE_QUALITY_REPORT.md');
    fs.writeFileSync(mdReportPath, this.generateMarkdownReport(), 'utf-8');
    console.log(`✓ Markdown 报告已保存: ${mdReportPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('前端代码静态分析完成！');
    console.log('='.repeat(80));
  }

  /**
   * 生成 Markdown 格式的报告
   */
  generateMarkdownReport() {
    const lines = [
      '# 前端代码质量报告',
      '',
      `**生成时间**: ${this.results.timestamp}`,
      '',
      '## 执行摘要',
      ''
    ];

    // ESLint 摘要
    const eslint = this.results.eslint;
    if (eslint.status === 'completed') {
      lines.push(`- **ESLint 代码规范检查**: 发现 ${eslint.totalErrors} 个错误，${eslint.totalWarnings} 个警告`);
    } else {
      lines.push(`- **ESLint 代码规范检查**: ${eslint.status}`);
    }

    // TypeScript 摘要
    const typescript = this.results.typescript;
    if (typescript.status === 'completed') {
      lines.push(`- **TypeScript 类型检查**: 发现 ${typescript.errors} 个类型错误`);
    } else {
      lines.push(`- **TypeScript 类型检查**: ${typescript.status}`);
    }

    // 未使用代码摘要
    const unused = this.results.unusedExports;
    if (unused.status === 'completed') {
      lines.push(`- **未使用代码检查**: 发现 ${unused.issues} 个未使用的变量或导入`);
    } else {
      lines.push(`- **未使用代码检查**: ${unused.status}`);
    }

    lines.push('', '## 详细结果', '');

    // ESLint 详细结果
    lines.push('### 1. ESLint 代码规范检查', '');
    if (eslint.status === 'completed') {
      if (eslint.totalErrors > 0 || eslint.totalWarnings > 0) {
        lines.push(`检查了 ${eslint.totalFiles} 个文件，其中 ${eslint.filesWithIssues} 个文件存在问题：`);
        lines.push('');
        
        if (eslint.issues && eslint.issues.length > 0) {
          lines.push('#### 问题文件（前10个）', '');
          eslint.issues.slice(0, 10).forEach((file, index) => {
            lines.push(`${index + 1}. **${file.filePath.replace(this.frontendDir, '.')}**`);
            lines.push(`   - 错误: ${file.errorCount}, 警告: ${file.warningCount}`);
            
            if (file.messages && file.messages.length > 0) {
              lines.push('   - 问题示例:');
              file.messages.slice(0, 3).forEach(msg => {
                lines.push(`     - [${msg.line}:${msg.column}] ${msg.message} (${msg.ruleId})`);
              });
            }
            lines.push('');
          });
        }
      } else {
        lines.push('✓ 未发现问题', '');
      }
    } else {
      lines.push(`状态: ${eslint.status}`, '');
    }

    // TypeScript 详细结果
    lines.push('### 2. TypeScript 类型检查', '');
    if (typescript.status === 'completed') {
      if (typescript.errors > 0) {
        lines.push(`发现 ${typescript.errors} 个类型错误，以下是前10个：`);
        lines.push('');
        if (typescript.errorSummary) {
          typescript.errorSummary.slice(0, 10).forEach((error, index) => {
            lines.push(`${index + 1}. ${error}`);
          });
        }
        lines.push('');
      } else {
        lines.push('✓ 未发现类型错误', '');
      }
    } else {
      lines.push(`状态: ${typescript.status}`, '');
    }

    // 未使用代码详细结果
    lines.push('### 3. 未使用代码检查', '');
    if (unused.status === 'completed') {
      if (unused.issues > 0) {
        lines.push(`发现 ${unused.issues} 个未使用的变量或导入，以下是前10个：`);
        lines.push('');
        if (unused.details) {
          unused.details.slice(0, 10).forEach((issue, index) => {
            lines.push(`${index + 1}. ${issue.message}`);
          });
        }
        lines.push('');
      } else {
        lines.push('✓ 未发现未使用的代码', '');
      }
    } else {
      lines.push(`状态: ${unused.status}`, '');
    }

    // 改进建议
    lines.push(
      '## 改进建议',
      '',
      '### 代码规范',
      '- 修复 ESLint 报告的错误和警告',
      '- 统一代码风格，遵循项目的 ESLint 配置',
      '- 添加必要的类型注解',
      '',
      '### 类型安全',
      '- 修复 TypeScript 编译器报告的类型错误',
      '- 避免使用 `any` 类型',
      '- 为函数参数和返回值添加明确的类型',
      '',
      '### 代码清理',
      '- 删除未使用的导入和变量',
      '- 移除注释掉的代码',
      '- 清理不再使用的组件和工具函数',
      '',
      '## 附录',
      '',
      '完整的 JSON 格式报告: `static_analysis_report.json`',
      ''
    );

    return lines.join('\n');
  }

  /**
   * 运行所有分析
   */
  runAll() {
    this.runESLint();
    this.runTypeScriptCheck();
    this.checkUnusedCode();
    this.generateReport();
  }
}

// 运行分析
const analyzer = new FrontendStaticAnalyzer();
analyzer.runAll();
