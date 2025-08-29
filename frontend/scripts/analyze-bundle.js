#!/usr/bin/env node

/**
 * Bundle 分析脚本
 * 分析构建产物的大小和结构
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DIST_DIR = path.resolve(__dirname, '../dist')
const ASSETS_DIR = path.join(DIST_DIR, 'assets')

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取 gzip 压缩后的大小
 */
function getGzipSize(filePath) {
  try {
    const gzipOutput = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' })
    return parseInt(gzipOutput.trim(), 10)
  } catch (error) {
    console.warn(`Unable to calculate gzip size for ${filePath}:`, error.message)
    return 0
  }
}

/**
 * 分析单个文件
 */
function analyzeFile(filePath) {
  const stats = fs.statSync(filePath)
  const originalSize = stats.size
  const gzipSize = getGzipSize(filePath)
  const compressionRatio = ((1 - gzipSize / originalSize) * 100).toFixed(1)

  return {
    path: filePath,
    originalSize,
    gzipSize,
    compressionRatio
  }
}

/**
 * 分析目录中的文件
 */
function analyzeDirectory(dir) {
  const files = []
  
  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        walkDir(fullPath)
      } else if (entry.isFile()) {
        files.push(analyzeFile(fullPath))
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    walkDir(dir)
  }
  
  return files
}

/**
 * 生成分析报告
 */
function generateReport() {
  console.log('🔍 分析构建产物...\n')
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ 构建目录不存在，请先运行 npm run build')
    process.exit(1)
  }
  
  const allFiles = analyzeDirectory(DIST_DIR)
  
  // 按类型分类
  const categories = {
    JavaScript: allFiles.filter(f => f.path.endsWith('.js')),
    CSS: allFiles.filter(f => f.path.endsWith('.css')),
    Images: allFiles.filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f.path)),
    Fonts: allFiles.filter(f => /\.(woff|woff2|ttf|eot)$/i.test(f.path)),
    Others: allFiles.filter(f => 
      !f.path.endsWith('.js') && 
      !f.path.endsWith('.css') && 
      !/\.(png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/i.test(f.path)
    )
  }
  
  let totalOriginal = 0
  let totalGzip = 0
  
  // 输出分类报告
  for (const [category, files] of Object.entries(categories)) {
    if (files.length === 0) continue
    
    console.log(`📁 ${category} 文件:`)
    console.log('=' .repeat(50))
    
    let categoryOriginal = 0
    let categoryGzip = 0
    
    // 按大小排序
    files.sort((a, b) => b.originalSize - a.originalSize)
    
    files.forEach(file => {
      const relativePath = path.relative(DIST_DIR, file.path)
      console.log(
        `  ${relativePath.padEnd(35)} ${formatSize(file.originalSize).padStart(8)} -> ${formatSize(file.gzipSize).padStart(8)} (${file.compressionRatio}%)`
      )
      
      categoryOriginal += file.originalSize
      categoryGzip += file.gzipSize
    })
    
    console.log(`  ${'TOTAL'.padEnd(35)} ${formatSize(categoryOriginal).padStart(8)} -> ${formatSize(categoryGzip).padStart(8)}\n`)
    
    totalOriginal += categoryOriginal
    totalGzip += categoryGzip
  }
  
  // 输出总计
  console.log('📊 总体统计:')
  console.log('=' .repeat(50))
  console.log(`总大小: ${formatSize(totalOriginal)} -> ${formatSize(totalGzip)} (压缩率: ${((1 - totalGzip / totalOriginal) * 100).toFixed(1)}%)`)
  console.log(`文件数量: ${allFiles.length}`)
  
  // 检查大文件
  const largeFiles = allFiles.filter(f => f.originalSize > 500 * 1024) // > 500KB
  if (largeFiles.length > 0) {
    console.log('\n⚠️  大文件警告 (>500KB):')
    console.log('=' .repeat(50))
    largeFiles.forEach(file => {
      const relativePath = path.relative(DIST_DIR, file.path)
      console.log(`  ${relativePath} (${formatSize(file.originalSize)})`)
    })
  }
  
  // 优化建议
  console.log('\n💡 优化建议:')
  console.log('=' .repeat(50))
  
  const jsFiles = categories.JavaScript
  const cssFiles = categories.CSS
  
  if (jsFiles.length > 10) {
    console.log('  • 考虑进一步代码分割，减少 JS 文件数量')
  }
  
  const largeJsFile = jsFiles.find(f => f.originalSize > 1024 * 1024) // > 1MB
  if (largeJsFile) {
    console.log('  • 存在大于1MB的JS文件，考虑懒加载或分割')
  }
  
  const totalJsSize = jsFiles.reduce((sum, f) => sum + f.gzipSize, 0)
  if (totalJsSize > 500 * 1024) { // > 500KB
    console.log('  • JavaScript总大小较大，考虑移除未使用的依赖')
  }
  
  const totalCssSize = cssFiles.reduce((sum, f) => sum + f.gzipSize, 0)
  if (totalCssSize > 100 * 1024) { // > 100KB
    console.log('  • CSS总大小较大，考虑移除未使用的样式')
  }
  
  console.log('\n✅ 分析完成!')
}

// 运行分析
generateReport()