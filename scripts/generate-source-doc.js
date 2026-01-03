const fs = require('fs');
const path = require('path');

// 需要包含的关键文件列表（按重要性排序）
const keyFiles = [
  // 核心代码生成逻辑
  { file: 'lib/code-generator.ts', description: '核心代码生成引擎' },
  { file: 'app/api/generate/route.ts', description: '代码生成API路由' },
  { file: 'app/generate/page.tsx', description: '代码生成主页面' },
  
  // 下载和文件处理
  { file: 'lib/download-helper.ts', description: '项目文件下载功能' },
  
  // CloudBase集成
  { file: 'lib/cloudbase-frontend.ts', description: 'CloudBase前端集成' },
  { file: 'lib/cloudbase.ts', description: 'CloudBase后端集成' },
  
  // 认证相关
  { file: 'lib/auth-context.tsx', description: '用户认证上下文' },
  
  // 数据库
  { file: 'lib/database/cloudbase.ts', description: 'CloudBase数据库操作' },
  
  // 配置和工具
  { file: 'lib/subscription-tiers.ts', description: '订阅方案配置' },
  { file: 'lib/utils.ts', description: '工具函数' },
  
  // 主页面
  { file: 'app/page.tsx', description: '应用主页面' },
  { file: 'app/layout.tsx', description: '应用布局' },
];

// 源代码文档格式化函数（不添加行号，代码照搬）
function formatSourceCode(fileContent, fileName, description) {
  // 只添加简单的文件分隔符，代码内容完全照搬
  const separator = '='.repeat(80);
  return `${separator}\n文件: ${fileName}\n描述: ${description}\n${separator}\n\n${fileContent}`;
}

// 读取文件内容
function readFileContent(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`文件不存在: ${fullPath}`);
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
    return null;
  }
}

// 生成源代码文档
function generateSourceDocument() {
  let allCode = '';
  let pageCount = 0;
  const linesPerPage = 50;
  
  // 添加文档头部
  allCode += '='.repeat(80) + '\n';
  allCode += 'mornFront 智能前端代码生成系统 - 源代码文档\n';
  allCode += '软件名称: mornFront 智能前端代码生成系统\n';
  allCode += '软件版本: V1.0.0\n';
  allCode += '文档生成日期: ' + new Date().toLocaleDateString('zh-CN') + '\n';
  allCode += '='.repeat(80) + '\n\n';
  
  // 收集所有文件的代码
  const allFormattedCode = [];
  
  for (const { file, description } of keyFiles) {
    const content = readFileContent(file);
    if (content) {
      const formatted = formatSourceCode(content, file, description);
      allFormattedCode.push(formatted);
      allFormattedCode.push('\n' + '='.repeat(80) + '\n\n');
    }
  }
  
  // 计算总行数
  const totalLines = allFormattedCode.join('\n').split('\n').length;
  
  // 生成前30页（前30页的代码）
  console.log('生成前30页源代码...');
  const first30Pages = allFormattedCode.join('\n').split('\n').slice(0, 30 * linesPerPage).join('\n');
  
  // 生成后30页（后30页的代码）
  console.log('生成后30页源代码...');
  const totalCodeLines = allFormattedCode.join('\n').split('\n');
  const last30Pages = totalCodeLines.slice(-30 * linesPerPage).join('\n');
  
  // 保存前30页
  const outputDir = path.join(__dirname, '..', 'soft-license-docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const front30Path = path.join(outputDir, '源代码文档-前30页.txt');
  fs.writeFileSync(front30Path, first30Pages, 'utf-8');
  console.log(`✓ 前30页已保存到: ${front30Path}`);
  
  // 保存后30页
  const last30Path = path.join(outputDir, '源代码文档-后30页.txt');
  fs.writeFileSync(last30Path, last30Pages, 'utf-8');
  console.log(`✓ 后30页已保存到: ${last30Path}`);
  
  // 生成完整的源代码清单
  const sourceList = keyFiles.map(({ file, description }) => {
    const fullPath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(fullPath);
    const stats = exists ? fs.statSync(fullPath) : null;
    const lineCount = exists ? fs.readFileSync(fullPath, 'utf-8').split('\n').length : 0;
    
    return {
      file,
      description,
      exists,
      lines: lineCount,
      size: stats ? stats.size : 0
    };
  });
  
  const listContent = '源代码文件清单\n' +
    '='.repeat(80) + '\n\n' +
    sourceList.map(({ file, description, exists, lines, size }) => {
      return `文件: ${file}\n` +
             `描述: ${description}\n` +
             `状态: ${exists ? '存在' : '不存在'}\n` +
             `行数: ${lines}\n` +
             `大小: ${size} 字节\n` +
             '-' .repeat(80);
    }).join('\n\n');
  
  const listPath = path.join(outputDir, '源代码文件清单.txt');
  fs.writeFileSync(listPath, listContent, 'utf-8');
  console.log(`✓ 源代码清单已保存到: ${listPath}`);
  
  // 生成统计信息
  const stats = {
    totalFiles: keyFiles.length,
    existingFiles: sourceList.filter(f => f.exists).length,
    totalLines: sourceList.reduce((sum, f) => sum + f.lines, 0),
    totalSize: sourceList.reduce((sum, f) => sum + f.size, 0)
  };
  
  console.log('\n统计信息:');
  console.log(`  总文件数: ${stats.totalFiles}`);
  console.log(`  存在文件数: ${stats.existingFiles}`);
  console.log(`  总代码行数: ${stats.totalLines}`);
  console.log(`  总文件大小: ${(stats.totalSize / 1024).toFixed(2)} KB`);
}

// 执行生成
console.log('开始生成源代码文档...\n');
generateSourceDocument();
console.log('\n源代码文档生成完成！');

