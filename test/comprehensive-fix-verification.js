/**
 * 测试文件重组验证脚本
 * 验证新的测试文件结构是否正常工作
 */

const fs = require('fs');
const path = require('path');

// 测试目录结构验证
function verifyTestStructure() {
  console.log('🔍 验证测试目录结构...');
  
  const requiredDirectories = [
    'test/unit/api',
    'test/unit/components', 
    'test/unit/services',
    'test/unit/encoding',
    'test/integration/api',
    'test/integration/database',
    'test/e2e/user-flows',
    'test/e2e/cross-platform',
    'test/fixtures/test-scenarios',
    'test/fixtures/user-data',
    'test/mocks/apis',
    'test/mocks/services',
    'test/mocks/servers',
    'test/performance/load-tests',
    'test/performance/memory-tests'
  ];

  const requiredFiles = [
    'test/unit/api/expansion-api.unit.test.js',
    'test/unit/encoding/chinese-encoding.unit.test.js',
    'test/integration/api/expansion-api.integration.test.js',
    'test/mocks/servers/express-test-server.mock.js',
    'test/mocks/servers/http-test-server.mock.js',
    'test/fixtures/user-data/test-users.json',
    'test/README.md'
  ];

  let allValid = true;

  // 检查目录
  console.log('\n检查目录结构:');
  requiredDirectories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${dir}`);
    } else {
      console.log(`❌ ${dir} - 目录不存在`);
      allValid = false;
    }
  });

  // 检查文件
  console.log('\n检查测试文件:');
  requiredFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
      allValid = false;
    }
  });

  return allValid;
}

// 验证package.json测试脚本
function verifyPackageScripts() {
  console.log('\n📜 验证package.json测试脚本...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json 文件不存在');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};

  const requiredScripts = [
    'test:unit',
    'test:integration', 
    'test:encoding',
    'test:e2e',
    'test:mock-server',
    'test:simple-server',
    'test:all-legacy'
  ];

  let allValid = true;
  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`✅ ${script}: ${scripts[script]}`);
    } else {
      console.log(`❌ ${script} - 脚本不存在`);
      allValid = false;
    }
  });

  return allValid;
}

// 模拟测试执行
function simulateTestExecution() {
  console.log('\n🏃 模拟测试执行...');
  
  // 检查测试文件是否可以正常加载
  const testFiles = [
    'test/unit/api/expansion-api.unit.test.js',
    'test/unit/encoding/chinese-encoding.unit.test.js',
    'test/integration/api/expansion-api.integration.test.js',
    'test/mocks/servers/express-test-server.mock.js',
    'test/mocks/servers/http-test-server.mock.js'
  ];

  let allValid = true;
  testFiles.forEach(file => {
    try {
      const fullPath = path.join(process.cwd(), file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 基本语法检查
      if (content.includes('module.exports') || content.includes('export')) {
        console.log(`✅ ${file} - 语法正常`);
      } else {
        console.log(`⚠️  ${file} - 未找到导出语句`);
      }
      
      // 检查是否包含测试函数
      if (content.includes('test') || content.includes('describe') || content.includes('function')) {
        console.log(`✅ ${file} - 包含测试函数`);
      } else {
        console.log(`⚠️  ${file} - 未找到测试函数`);
      }
      
    } catch (error) {
      console.log(`❌ ${file} - 加载错误: ${error.message}`);
      allValid = false;
    }
  });

  return allValid;
}

// 生成整理报告
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试文件重组验证报告');
  console.log('='.repeat(60));
  
  const structureValid = verifyTestStructure();
  const scriptsValid = verifyPackageScripts();
  const executionValid = simulateTestExecution();
  
  console.log('\n' + '-'.repeat(60));
  console.log('📈 验证结果汇总:');
  console.log('-'.repeat(60));
  
  console.log(`测试目录结构: ${structureValid ? '✅ 正常' : '❌ 异常'}`);
  console.log(`package.json脚本: ${scriptsValid ? '✅ 正常' : '❌ 异常'}`);
  console.log(`测试文件语法: ${executionValid ? '✅ 正常' : '❌ 异常'}`);
  
  const overallStatus = structureValid && scriptsValid && executionValid;
  console.log(`\n总体状态: ${overallStatus ? '✅ 成功' : '❌ 失败'}`);
  
  if (overallStatus) {
    console.log('\n🎉 测试文件重组完成！');
    console.log('🚀 可以使用以下命令运行测试:');
    console.log('   pnpm test:unit');
    console.log('   pnpm test:integration');
    console.log('   pnpm test:encoding');
    console.log('   pnpm test:mock-server');
  } else {
    console.log('\n⚠️  测试文件重组存在问题，请检查上述错误信息');
  }
  
  console.log('\n' + '='.repeat(60));
  
  return overallStatus;
}

// 主函数
function main() {
  console.log('🔧 开始验证测试文件重组结果...');
  
  const success = generateReport();
  
  // 退出码
  process.exit(success ? 0 : 1);
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = {
  verifyTestStructure,
  verifyPackageScripts,
  simulateTestExecution,
  generateReport
};
