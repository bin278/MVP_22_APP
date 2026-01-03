#!/usr/bin/env node

/**
 * 提取源代码用于软著申请
 * 提取前30页和后30页的源代码
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = './app';
const OUTPUT_DIR = './软著申请材料/源代码';
const LINES_PER_PAGE = 50; // 每页50行
const TOTAL_PAGES = 30; // 需要30页

// 递归获取所有TypeScript文件
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules')) {
      getAllTsFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// 提取前N页代码
function extractFirstPages(files, totalPages, linesPerPage) {
  let currentPage = 0;
  let currentLine = 0;

  const output = [];

  output.push('========================================');
  output.push('       AI智能代码生成系统');
  output.push('         源代码（前30页）');
  output.push('========================================\n');

  for (const file of files) {
    if (currentPage >= totalPages) break;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // 如果是新文件的第一页，添加文件头
    if (currentLine === 0) {
      output.push(`\n// ========== 文件: ${file} ==========\n`);
    }

    for (const line of lines) {
      output.push(line);
      currentLine++;

      if (currentLine >= linesPerPage) {
        currentPage++;
        currentLine = 0;
        output.push(`\n// ----- 第 ${currentPage} 页 -----\n`);

        if (currentPage >= totalPages) {
          break;
        }
      }
    }
  }

  return output.join('\n');
}

// 提取后N页代码
function extractLastPages(files, totalPages, linesPerPage) {
  const totalLines = files.reduce((sum, file) => {
    const content = fs.readFileSync(file, 'utf-8');
    return sum + content.split('\n').length;
  }, 0);

  const totalLinesNeeded = totalPages * linesPerPage;
  const startLine = totalLines - totalLinesNeeded;

  let currentLine = 0;
  let outputLine = 0;
  const output = [];

  output.push('========================================');
  output.push('       AI智能代码生成系统');
  output.push('         源代码（后30页）');
  output.push('========================================\n');

  for (const file of files) {
    if (outputLine >= totalLinesNeeded) break;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      currentLine++;

      if (currentLine > startLine) {
        if (outputLine % linesPerPage === 0) {
          output.push(`\n// ========== 文件: ${file} ==========\n`);
        }

        output.push(line);
        outputLine++;
      }
    }
  }

  return output.join('\n');
}

// 主函数
function main() {
  console.log('开始提取源代码...\n');

  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 获取所有源代码文件
  const files = getAllTsFiles(SOURCE_DIR);
  console.log(`找到 ${files.length} 个源代码文件\n`);

  // 按路径排序
  files.sort();

  // 提取前30页
  console.log('提取前30页...');
  const firstPages = extractFirstPages(files, TOTAL_PAGES, LINES_PER_PAGE);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '01-源代码前30页.txt'),
    firstPages,
    'utf-8'
  );
  console.log('✓ 前30页已保存到: 01-源代码前30页.txt');

  // 提取后30页
  console.log('\n提取后30页...');
  const lastPages = extractLastPages(files, TOTAL_PAGES, LINES_PER_PAGE);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '02-源代码后30页.txt'),
    lastPages,
    'utf-8'
  );
  console.log('✓ 后30页已保存到: 02-源代码后30页.txt');

  // 生成完整代码清单
  console.log('\n生成代码清单...');
  let totalLines = 0;
  const manifest = files.map(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    totalLines += lines;
    return {
      file: file,
      lines: lines
    };
  });

  const manifestContent = [
    '========================================',
    '       AI智能代码生成系统',
    '         源代码清单',
    '========================================\n',
    `总文件数: ${files.length}`,
    `总代码行数: ${totalLines}\n`,
    '文件列表:\n',
    ...manifest.map((item, index) => {
      const num = String(index + 1).padStart(3, '0');
      return `${num}. ${item.file} (${item.lines} 行)`;
    })
  ].join('\n');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '03-源代码清单.txt'),
    manifestContent,
    'utf-8'
  );
  console.log(`✓ 代码清单已保存到: 03-源代码清单.txt`);
  console.log(`  - 总文件数: ${files.length}`);
  console.log(`  - 总代码行数: ${totalLines}`);

  console.log('\n✅ 源代码提取完成！');
}

main();
