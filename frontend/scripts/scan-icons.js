/**
 * 扫描项目中所有使用的Arco Design图标
 */
const fs = require('fs');
const path = require('path');

const iconSet = new Set();
const fileIconMap = new Map();

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules, dist, build 等目录
      if (!['node_modules', 'dist', 'build', '.git', '__tests__'].includes(file)) {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 匹配图标导入语句
      const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@arco-design\/web-react\/icon['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const imports = match[1];
        const icons = imports.split(',').map(s => s.trim()).filter(s => s.startsWith('Icon'));
        
        icons.forEach(icon => {
          iconSet.add(icon);
          if (!fileIconMap.has(icon)) {
            fileIconMap.set(icon, []);
          }
          fileIconMap.get(icon).push(filePath.replace(/\\/g, '/'));
        });
      }
    }
  }
}

// 扫描 src 目录
const srcDir = path.join(__dirname, '..', 'src');
scanDirectory(srcDir);

// 输出结果
const sortedIcons = Array.from(iconSet).sort();

console.log('\n=== 项目中使用的所有图标 ===\n');
console.log(`总计: ${sortedIcons.length} 个不同的图标\n`);

sortedIcons.forEach(icon => {
  const files = fileIconMap.get(icon);
  console.log(`${icon} (使用 ${files.length} 次)`);
});

console.log('\n=== 图标列表（用于测试）===\n');
console.log(JSON.stringify(sortedIcons, null, 2));
