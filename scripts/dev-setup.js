#!/usr/bin/env node

/**
 * 开发环境设置脚本
 * 自动化项目初始设置和检查
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')

const execAsync = util.promisify(exec)

class DevSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.checks = []
    this.fixes = []
  }

  async run() {
    console.log('🚀 开始开发环境设置检查...\n')
    
    await this.checkNodeVersion()
    await this.checkPnpmVersion()
    await this.checkDependencies()
    await this.checkGitSetup()
    await this.checkEnvironmentFiles()
    await this.runQualityChecks()
    
    this.printSummary()
  }

  async checkNodeVersion() {
    try {
      const { stdout } = await execAsync('node --version')
      const version = stdout.trim()
      const majorVersion = parseInt(version.substring(1).split('.')[0])
      
      if (majorVersion >= 18) {
        this.addCheck('✅ Node.js版本检查', `${version} (>= 18.0.0)`)
      } else {
        this.addCheck('❌ Node.js版本过低', `当前: ${version}, 需要: >= 18.0.0`)
        this.addFix('请升级Node.js到18.0.0或更高版本')
      }
    } catch (error) {
      this.addCheck('❌ Node.js未安装', 'Node.js不存在')
      this.addFix('请安装Node.js 18.0.0或更高版本')
    }
  }

  async checkPnpmVersion() {
    try {
      const { stdout } = await execAsync('pnpm --version')
      const version = stdout.trim()
      const majorVersion = parseInt(version.split('.')[0])
      
      if (majorVersion >= 8) {
        this.addCheck('✅ pnpm版本检查', `${version} (>= 8.0.0)`)
      } else {
        this.addCheck('❌ pnpm版本过低', `当前: ${version}, 需要: >= 8.0.0`)
        this.addFix('运行: npm install -g pnpm@latest')
      }
    } catch (error) {
      this.addCheck('❌ pnpm未安装', 'pnpm不存在')
      this.addFix('运行: npm install -g pnpm')
    }
  }

  async checkDependencies() {
    const lockExists = fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))
    const nodeModulesExists = fs.existsSync(path.join(this.projectRoot, 'node_modules'))
    
    if (lockExists && nodeModulesExists) {
      this.addCheck('✅ 依赖安装检查', '所有依赖已安装')
    } else {
      this.addCheck('❌ 依赖未安装', '需要安装项目依赖')
      this.addFix('运行: pnpm install')
    }
  }

  async checkGitSetup() {
    const gitExists = fs.existsSync(path.join(this.projectRoot, '.git'))
    
    if (gitExists) {
      this.addCheck('✅ Git仓库初始化', 'Git仓库已初始化')
    } else {
      this.addCheck('❌ Git未初始化', '建议初始化Git仓库')
      this.addFix('运行: git init && git add . && git commit -m "Initial commit"')
    }
  }

  async checkEnvironmentFiles() {
    const frontendEnvExists = fs.existsSync(path.join(this.projectRoot, 'frontend/.env'))
    
    if (frontendEnvExists) {
      this.addCheck('✅ 环境配置文件', '前端环境文件存在')
    } else {
      this.addCheck('❌ 环境配置缺失', '前端.env文件不存在')
      this.addFix('从 frontend/.env.example 复制并配置环境变量')
    }
  }

  async runQualityChecks() {
    try {
      // TypeScript检查
      await execAsync('pnpm typecheck', { cwd: this.projectRoot })
      this.addCheck('✅ TypeScript检查', '类型检查通过')
    } catch (error) {
      this.addCheck('❌ TypeScript检查失败', '存在类型错误')
      this.addFix('运行: pnpm typecheck 查看具体错误并修复')
    }

    try {
      // ESLint检查
      await execAsync('pnpm lint', { cwd: this.projectRoot })
      this.addCheck('✅ ESLint检查', '代码规范检查通过')
    } catch (error) {
      this.addCheck('⚠️  ESLint警告', '存在代码规范问题')
      this.addFix('运行: pnpm lint --fix 自动修复部分问题')
    }
  }

  addCheck(status, message) {
    this.checks.push({ status, message })
  }

  addFix(message) {
    this.fixes.push(message)
  }

  printSummary() {
    console.log('\n📋 检查结果:')
    this.checks.forEach(check => {
      console.log(`  ${check.status}: ${check.message}`)
    })

    if (this.fixes.length > 0) {
      console.log('\n🔧 需要修复的问题:')
      this.fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`)
      })
    } else {
      console.log('\n🎉 所有检查通过！开发环境已准备就绪。')
    }

    console.log('\n📖 常用命令:')
    console.log('  pnpm dev      - 启动开发服务器')
    console.log('  pnpm build    - 构建生产版本')
    console.log('  pnpm test     - 运行测试')
    console.log('  pnpm lint     - 代码规范检查')
    console.log('  pnpm typecheck - 类型检查')
    console.log('')
  }
}

if (require.main === module) {
  const setup = new DevSetup()
  setup.run().catch(console.error)
}

module.exports = DevSetup