#!/usr/bin/env node

/**
 * CloudBase 部署使用指南 - cloudbaserc.json 详细说明
 */

console.log('🚀 CloudBase 部署使用指南 - cloudbaserc.json');
console.log('==========================================\n');

console.log('📄 cloudbaserc.json 文件的使用方法：\n');

console.log('🔍 cloudbaserc.json 的作用：');
console.log('===========================');
console.log('• 定义部署环境和配置');
console.log('• 指定使用的 CloudBase 插件');
console.log('• 设置服务运行参数');
console.log('• 控制超时时间和端口');
console.log('');

console.log('📋 当前配置解读：');
console.log('================');

console.log('你的 cloudbaserc.json 配置：');
console.log('```json');
console.log('{');
console.log('  "envId": "cloud1-3gn61ziydcfe6a57",');
console.log('  "framework": {');
console.log('    "plugins": {');
console.log('      "run": {');
console.log('        "use": "@cloudbase/framework-plugin-run",');
console.log('        "inputs": {');
console.log('          "serviceName": "mornfront",');
console.log('          "timeout": 300,');
console.log('          "port": 3000');
console.log('        }');
console.log('      }');
console.log('    }');
console.log('  }');
console.log('}');
console.log('```');
console.log('');

console.log('🔧 配置参数说明：');
console.log('================');

console.log('1️⃣ envId: "cloud1-3gn61ziydcfe6a57"');
console.log('   • 目标 CloudBase 环境ID');
console.log('   • 对应控制台的环境ID');
console.log('   • 确保与环境变量一致');
console.log('');

console.log('2️⃣ @cloudbase/framework-plugin-run');
console.log('   • 云托管部署插件');
console.log('   • 用于部署到 CloudBase 云托管服务');
console.log('   • 支持 Next.js 应用');
console.log('');

console.log('3️⃣ serviceName: "mornfront"');
console.log('   • 服务名称（云托管实例名）');
console.log('   • 在控制台显示的服务名');
console.log('   • 域名会基于此生成');
console.log('');

console.log('4️⃣ timeout: 300');
console.log('   • 超时时间：300秒 = 5分钟');
console.log('   • 解决复杂代码生成中断问题');
console.log('   • 支持长时间AI任务');
console.log('');

console.log('5️⃣ port: 3000');
console.log('   • 应用监听端口');
console.log('   • Next.js 默认端口');
console.log('   • 匹配开发环境端口');
console.log('');

console.log('🎯 部署使用方法：');
console.log('================\n');

console.log('方法1：使用 npm scripts（推荐）');
console.log('===============================');

console.log('# 1. 安装 CloudBase CLI（如果还没安装）');
console.log('npm install -g @cloudbase/cli');
console.log('');

console.log('# 2. 登录 CloudBase');
console.log('npm run cloudbase:login');
console.log('');

console.log('# 3. 检查环境');
console.log('npm run cloudbase:env:list');
console.log('');

console.log('# 4. 部署应用（自动读取 cloudbaserc.json）');
console.log('npm run cloudbase:deploy');
console.log('');

console.log('# 5. 部署云函数（可选）');
console.log('npm run cloudbase:functions:deploy');
console.log('');

console.log('方法2：直接使用 CloudBase CLI');
console.log('===============================');

console.log('# 部署到云托管（使用 cloudbaserc.json 配置）');
console.log('cloudbase hosting:deploy');
console.log('');

console.log('# 部署云函数');
console.log('cloudbase functions:deploy');
console.log('');

console.log('# 查看部署状态');
console.log('cloudbase hosting:list');
console.log('');

console.log('方法3：自动部署脚本');
console.log('====================');

console.log('# 使用项目的自动部署脚本');
console.log('npm run cloudbase:auto-deploy');
console.log('');

console.log('# 预览部署（不会实际部署）');
console.log('npm run cloudbase:dry-run');
console.log('');

console.log('🔄 部署流程详解：');
console.log('================\n');

console.log('步骤1：代码准备');
console.log('--------------');
console.log('• 确保代码已提交到 GitHub');
console.log('• 本地测试构建：npm run build');
console.log('• 验证环境变量配置');
console.log('');

console.log('步骤2：CloudBase 连接');
console.log('--------------------');
console.log('• CloudBase CLI 自动读取 cloudbaserc.json');
console.log('• 连接到指定环境 (cloud1-3gn61ziydcfe6a57)');
console.log('• 使用配置的插件 (@cloudbase/framework-plugin-run)');
console.log('');

console.log('步骤3：构建和部署');
console.log('----------------');
console.log('• 下载项目代码');
console.log('• 执行构建：pnpm build');
console.log('• 创建云托管服务：mornfront');
console.log('• 设置超时时间：300秒');
console.log('• 配置端口：3000');
console.log('');

console.log('步骤4：服务启动');
console.log('--------------');
console.log('• 启动 Next.js 应用');
console.log('• 监听端口 3000');
console.log('• 自动分配域名');
console.log('• 开始提供服务');
console.log('');

console.log('⚙️ 高级配置选项：');
console.log('================\n');

console.log('修改超时时间：');
console.log('```json');
console.log('"timeout": 600  // 10分钟');
console.log('```');
console.log('');

console.log('修改服务名称：');
console.log('```json');
console.log('"serviceName": "my-app"');
console.log('```');
console.log('');

console.log('添加环境变量：');
console.log('```json');
console.log('"envVariables": {');
console.log('  "NODE_ENV": "production",');
console.log('  "DEBUG": "false"');
console.log('}');
console.log('```');
console.log('');

console.log('🔍 验证部署结果：');
console.log('================\n');

console.log('# 检查服务状态');
console.log('npm run cloudbase:hosting:list');
console.log('');

console.log('# 查看部署日志');
console.log('cloudbase hosting:log --tail');
console.log('');

console.log('# 测试应用');
console.log('curl https://[你的域名]/api/health');
console.log('');

console.log('📊 监控和调试：');
console.log('==============\n');

console.log('CloudBase 控制台监控：');
console.log('• 访问：https://console.cloud.tencent.com/tcb/');
console.log('• 云托管 → mornfront → 日志');
console.log('• 云托管 → mornfront → 监控');
console.log('');

console.log('本地调试：');
console.log('• npm run cloudbase:dev（CloudBase 开发模式）');
console.log('• npm run cloudbase:test（完整测试）');
console.log('');

console.log('🔧 常见问题解决：');
console.log('================\n');

console.log('问题1：部署失败');
console.log('• 检查 cloudbaserc.json 语法');
console.log('• 确认 envId 正确');
console.log('• 查看构建日志');
console.log('');

console.log('问题2：超时错误');
console.log('• 确认 timeout 设置为 300');
console.log('• 检查 CloudBase 控制台超时设置');
console.log('');

console.log('问题3：环境变量不生效');
console.log('• 在控制台重新配置环境变量');
console.log('• 重新部署应用');
console.log('');

console.log('📚 相关文档：');
console.log('============\n');

console.log('• CLOUDBASE_CLOUD_HOSTING_DEPLOYMENT.md');
console.log('• CLOUDBASE_DB_SETUP.md');
console.log('• docs/CODE_GENERATION_TIMEOUT.md');
console.log('');

console.log('🎯 快速部署命令：');
console.log('================\n');

console.log('# 一键部署（推荐）');
console.log('npm run cloudbase:full-deploy');
console.log('');

console.log('# 或分步部署');
console.log('npm run cloudbase:login && npm run cloudbase:deploy');
console.log('');

console.log('💡 提示：');
console.log('======');
console.log('• cloudbaserc.json 确保每次部署都使用相同配置');
console.log('• 修改配置后需要重新部署才能生效');
console.log('• 超时时间设置对解决AI生成中断至关重要');
console.log('');

console.log('🚀 现在就开始部署吧！\n');






