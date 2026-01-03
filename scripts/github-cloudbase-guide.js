#!/usr/bin/env node

/**
 * GitHub + CloudBase 自动部署指南
 */

console.log('🚀 GitHub + CloudBase 自动部署指南');
console.log('=================================\n');

console.log('✅ GitHub 部署可以读取 cloudbaserc.json！\n');

console.log('📋 支持情况分析：');
console.log('================\n');

console.log('🔍 CloudBase 支持两种部署方式：');
console.log('');

console.log('方式1：GitHub 自动部署（推荐）');
console.log('-----------------------------');
console.log('• ✅ 支持读取 cloudbaserc.json');
console.log('• ✅ 自动触发部署');
console.log('• ✅ 支持分支管理');
console.log('• ✅ 环境变量统一管理');
console.log('');

console.log('方式2：CLI 手动部署');
console.log('-------------------');
console.log('• ✅ 支持读取 cloudbaserc.json');
console.log('• ❌ 需要手动执行');
console.log('• ✅ 灵活的部署控制');
console.log('');

console.log('🎯 GitHub 部署的 cloudbaserc.json 使用：');
console.log('=====================================\n');

console.log('当你配置 GitHub 自动部署时，CloudBase 会：');
console.log('1. 从 GitHub 拉取代码');
console.log('2. 检测项目根目录的 cloudbaserc.json');
console.log('3. 根据配置进行构建和部署');
console.log('');

console.log('你的 cloudbaserc.json 配置会被完整使用：');
console.log('```json');
console.log('{');
console.log('  "envId": "cloud1-3gn61ziydcfe6a57",  // ✅ 自动使用');
console.log('  "framework": {');
console.log('    "plugins": {');
console.log('      "run": {');
console.log('        "use": "@cloudbase/framework-plugin-run",  // ✅ 自动使用');
console.log('        "inputs": {');
console.log('          "serviceName": "mornfront",  // ✅ 自动使用');
console.log('          "timeout": 300,             // ✅ 自动使用');
console.log('          "port": 3000                // ✅ 自动使用');
console.log('        }');
console.log('      }');
console.log('    }');
console.log('  }');
console.log('}');
console.log('```');
console.log('');

console.log('🚀 GitHub 自动部署设置步骤：');
console.log('===========================\n');

console.log('步骤1：准备代码');
console.log('--------------');
console.log('• 确保 cloudbaserc.json 在项目根目录');
console.log('• 提交所有代码到 GitHub');
console.log('');

console.log('步骤2：CloudBase 控制台配置');
console.log('----------------------------');
console.log('1. 登录 https://console.cloud.tencent.com/tcb/');
console.log('2. 选择你的环境');
console.log('3. 进入 云托管 页面');
console.log('4. 点击 新建服务 或 部署管理');
console.log('');

console.log('步骤3：连接 GitHub');
console.log('------------------');
console.log('• 选择 "GitHub" 作为代码源');
console.log('• 授权腾讯云访问你的 GitHub 仓库');
console.log('• 选择仓库和分支（通常是 main）');
console.log('');

console.log('步骤4：部署配置');
console.log('----------------');
console.log('• 服务名称：mornfront（来自 cloudbaserc.json）');
console.log('• 构建命令：自动读取配置');
console.log('• 超时时间：300秒（来自 cloudbaserc.json）');
console.log('• 端口：3000（来自 cloudbaserc.json）');
console.log('');

console.log('步骤5：环境变量');
console.log('----------------');
console.log('在 CloudBase 控制台单独配置环境变量：');
console.log('• JWT_SECRET');
console.log('• DEEPSEEK_API_KEY');
console.log('• NEXT_PUBLIC_APP_URL');
console.log('• NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID');
console.log('');

console.log('🎉 自动部署的优势：');
console.log('==================\n');

console.log('✅ 推送代码自动部署');
console.log('   git push → CloudBase 自动检测 → 自动构建 → 自动部署');
console.log('');

console.log('✅ 配置统一管理');
console.log('   cloudbaserc.json 在代码仓库中，版本控制');
console.log('');

console.log('✅ 环境隔离');
console.log('   不同分支可以有不同的 cloudbaserc.json');
console.log('');

console.log('✅ 部署历史');
console.log('   CloudBase 控制台查看每次部署详情');
console.log('');

console.log('🔧 配置 cloudbaserc.json 的最佳实践：');
console.log('===================================\n');

console.log('1. 环境特定配置：');
console.log('```json');
console.log('// 生产环境');
console.log('{');
console.log('  "envId": "cloud1-prod-env",');
console.log('  "framework": {');
console.log('    "plugins": {');
console.log('      "run": {');
console.log('        "inputs": {');
console.log('          "serviceName": "mornfront-prod",');
console.log('          "timeout": 300');
console.log('        }');
console.log('      }');
console.log('    }');
console.log('  }');
console.log('}');
console.log('```');
console.log('');

console.log('2. 分支特定配置：');
console.log('• main 分支：生产环境配置');
console.log('• develop 分支：开发环境配置');
console.log('• feature/* 分支：测试环境配置');
console.log('');

console.log('📊 部署流程图：');
console.log('==============\n');

console.log('GitHub Push');
console.log('      ↓');
console.log('CloudBase Webhook 触发');
console.log('      ↓');
console.log('读取 cloudbaserc.json');
console.log('      ↓');
console.log('环境ID: cloud1-3gn61ziydcfe6a57');
console.log('      ↓');
console.log('服务名: mornfront');
console.log('      ↓');
console.log('超时: 300秒, 端口: 3000');
console.log('      ↓');
console.log('构建 + 部署完成');
console.log('');

console.log('🔍 验证 GitHub 部署配置：');
console.log('========================\n');

console.log('检查 cloudbaserc.json 是否正确：');
console.log('```bash');
console.log('node -e "console.log(JSON.stringify(require(\'./cloudbaserc.json\'), null, 2))"');
console.log('```');
console.log('');

console.log('测试本地配置：');
console.log('```bash');
console.log('npm run cloudbase:dry-run  # 预览部署配置');
console.log('```');
console.log('');

console.log('🛠️ 故障排除：');
console.log('============\n');

console.log('问题1：GitHub 连接失败');
console.log('• 检查 GitHub 仓库权限');
console.log('• 确认仓库是公开的或已授权');
console.log('• 验证分支名称正确');
console.log('');

console.log('问题2：cloudbaserc.json 不生效');
console.log('• 确认文件在项目根目录');
console.log('• 检查 JSON 语法正确性');
console.log('• 确认 envId 与 CloudBase 环境匹配');
console.log('');

console.log('问题3：部署超时');
console.log('• 检查 timeout 设置是否足够（300秒）');
console.log('• 确认构建命令正确');
console.log('• 查看 CloudBase 控制台构建日志');
console.log('');

console.log('🎯 推荐配置：');
console.log('============\n');

console.log('你的 cloudbaserc.json 已经完美配置：');
console.log('• ✅ envId 正确');
console.log('• ✅ timeout 300秒（解决 AI 生成中断）');
console.log('• ✅ serviceName 合适');
console.log('• ✅ port 匹配 Next.js');
console.log('');

console.log('🚀 开始使用 GitHub 部署：');
console.log('======================\n');

console.log('1. 提交 cloudbaserc.json 到 GitHub：');
console.log('   git add cloudbaserc.json');
console.log('   git commit -m "feat: 添加 CloudBase 部署配置"');
console.log('   git push origin main');
console.log('');

console.log('2. CloudBase 控制台配置：');
console.log('   • 云托管 → 新建服务');
console.log('   • 选择 GitHub 代码源');
console.log('   • 连接仓库');
console.log('   • 自动读取配置并部署');
console.log('');

console.log('3. 后续更新：');
console.log('   • 推送代码 → 自动重新部署');
console.log('   • 修改 cloudbaserc.json → 推送 → 自动应用新配置');
console.log('');

console.log('💡 关键优势：');
console.log('============');
console.log('• GitHub 部署完全支持 cloudbaserc.json');
console.log('• 配置随代码版本控制');
console.log('• 自动部署，提高效率');
console.log('• 解决复杂代码生成超时问题');
console.log('');

console.log('🎉 现在就可以享受自动部署的便利了！\n');






