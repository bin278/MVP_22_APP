#!/usr/bin/env node

/**
 * CloudBase 云部署自动化脚本
 * 用于自动部署 mvp_22 到 CloudBase 云托管
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CloudBaseDeployer {
  constructor() {
    this.projectRoot = path.resolve(__dirname);
    this.isWindows = process.platform === 'win32';
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };
    console.log(`${colors[level]}[${timestamp}] [${level}] ${message}${colors.RESET}`);
  }

  execCommand(command, options = {}) {
    try {
      this.log(`执行命令: ${command}`);
      const result = execSync(command, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        ...options
      });
      return result;
    } catch (error) {
      this.log(`命令执行失败: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  checkPrerequisites() {
    this.log('检查部署前置条件...');

    // 检查 Node.js 版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 16) {
      throw new Error(`Node.js 版本过低: ${nodeVersion}, 需要 16+`);
    }
    this.log(`✅ Node.js 版本: ${nodeVersion}`);

    // 检查 CloudBase CLI
    try {
      const cliVersion = execSync('cloudbase --version', { encoding: 'utf8' }).trim();
      this.log(`✅ CloudBase CLI 版本: ${cliVersion}`);
    } catch (error) {
      throw new Error('CloudBase CLI 未安装，请运行: npm install -g @cloudbase/cli');
    }

    // 检查环境变量文件
    const envFiles = ['.env.local', '.env'];
    let envExists = false;
    for (const envFile of envFiles) {
      if (fs.existsSync(path.join(this.projectRoot, envFile))) {
        envExists = true;
        break;
      }
    }
    if (!envExists) {
      throw new Error('未找到环境变量文件，请创建 .env.local 或 .env 文件');
    }
    this.log('✅ 环境变量文件存在');

    // 检查 CloudBase 配置文件
    if (!fs.existsSync(path.join(this.projectRoot, '.cloudbaserc.json'))) {
      throw new Error('未找到 CloudBase 配置文件 .cloudbaserc.json');
    }
    this.log('✅ CloudBase 配置文件存在');
  }

  checkEnvironment() {
    this.log('检查 CloudBase 环境...');

    // 检查登录状态
    try {
      const envList = execSync('cloudbase env:list --json', { encoding: 'utf8' });
      const envs = JSON.parse(envList);
      if (envs.length === 0) {
        throw new Error('未找到 CloudBase 环境，请先创建环境');
      }
      this.log(`✅ CloudBase 环境: ${envs[0].envId}`);
    } catch (error) {
      throw new Error('CloudBase 未登录或无环境权限，请运行: cloudbase login');
    }
  }

  installDependencies() {
    this.log('安装项目依赖...');

    // 检测包管理器
    let packageManager = 'npm';
    if (fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
      packageManager = 'pnpm';
    } else if (fs.existsSync(path.join(this.projectRoot, 'yarn.lock'))) {
      packageManager = 'yarn';
    }

    this.log(`使用包管理器: ${packageManager}`);

    // 安装依赖
    if (packageManager === 'pnpm') {
      this.execCommand('pnpm install --frozen-lockfile');
    } else if (packageManager === 'yarn') {
      this.execCommand('yarn install --frozen-lockfile');
    } else {
      this.execCommand('npm ci');
    }

    this.log('✅ 依赖安装完成');
  }

  buildProject() {
    this.log('构建项目...');

    // 设置 CloudBase 构建环境变量
    process.env.CLOUDBASE_BUILD = 'true';

    // 清理旧的构建文件
    const nextDir = path.join(this.projectRoot, '.next');
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
    }

    // 构建项目
    this.execCommand('npm run cloudbase:build');

    // 检查构建结果
    if (!fs.existsSync(path.join(nextDir, 'standalone'))) {
      throw new Error('构建失败，未找到 standalone 输出');
    }

    this.log('✅ 项目构建完成');
  }

  deployFunctions() {
    this.log('部署云函数...');

    try {
      // 部署邮箱验证码云函数
      this.execCommand('npm run cloudbase:functions:deploy-email');
      this.log('✅ 云函数部署完成');
    } catch (error) {
      this.log('⚠️ 云函数部署失败，跳过 (可选功能)', 'WARNING');
    }
  }

  deployHosting() {
    this.log('部署到云托管...');

    // 部署到云托管
    this.execCommand('npm run cloudbase:deploy');

    this.log('✅ 云托管部署完成');
  }

  verifyDeployment() {
    this.log('验证部署结果...');

    // 获取部署信息
    const hostingInfo = execSync('cloudbase hosting:list --json', { encoding: 'utf8' });
    const hosting = JSON.parse(hostingInfo);

    if (hosting.length === 0) {
      throw new Error('未找到部署的应用');
    }

    const app = hosting[0];
    this.log(`✅ 应用状态: ${app.status}`);
    this.log(`✅ 应用域名: https://${app.hosting}.tcloudbaseapp.com`);

    // 等待应用启动
    this.log('等待应用启动...');
    let retries = 0;
    const maxRetries = 30;

    while (retries < maxRetries) {
      try {
        execSync(`curl -f https://${app.hosting}.tcloudbaseapp.com/api/health`, {
          timeout: 5000,
          stdio: 'pipe'
        });
        this.log('✅ 应用健康检查通过');
        break;
      } catch (error) {
        retries++;
        this.log(`等待应用启动 (${retries}/${maxRetries})...`);
        execSync('sleep 10');
      }
    }

    if (retries >= maxRetries) {
      this.log('⚠️ 应用启动超时，请稍后手动检查', 'WARNING');
    }

    return {
      status: 'success',
      domain: `https://${app.hosting}.tcloudbaseapp.com`,
      appId: app.hosting
    };
  }

  async deploy() {
    try {
      this.log('开始 CloudBase 云部署...', 'INFO');

      // 执行部署步骤
      this.checkPrerequisites();
      this.checkEnvironment();
      this.installDependencies();
      this.buildProject();
      this.deployFunctions();
      this.deployHosting();

      // 验证部署
      const result = this.verifyDeployment();

      // 输出部署结果
      console.log('\n' + '='.repeat(60));
      this.log('🎉 CloudBase 云部署完成！', 'SUCCESS');
      console.log(`   🌐 应用域名: ${result.domain}`);
      console.log(`   📱 管理后台: https://console.cloud.tencent.com/tcb/env/${process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID}`);
      console.log(`   🔍 健康检查: ${result.domain}/api/health`);
      console.log('='.repeat(60));

      // 输出后续步骤
      console.log('\n📋 后续配置步骤:');
      console.log('   1. 配置支付功能 (可选)');
      console.log('   2. 绑定自定义域名');
      console.log('   3. 配置监控告警');
      console.log('   4. 测试所有功能');

      return result;

    } catch (error) {
      this.log(`部署失败: ${error.message}`, 'ERROR');
      console.log('\n🔧 故障排除:');
      console.log('   1. 检查 CloudBase CLI 登录状态');
      console.log('   2. 验证环境变量配置');
      console.log('   3. 查看 CloudBase 控制台日志');
      console.log('   4. 参考: CLOUDBASE_CLOUD_DEPLOYMENT_GUIDE.md');

      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
CloudBase 云部署工具

用法:
  node deploy-cloudbase.js [选项]

选项:
  --help, -h     显示帮助信息
  --dry-run      仅检查配置，不执行部署
  --skip-build   跳过构建步骤
  --skip-test    跳过验证步骤

示例:
  node deploy-cloudbase.js              # 完整部署
  node deploy-cloudbase.js --dry-run    # 仅检查配置
    `);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  const deployer = new CloudBaseDeployer();

  if (args.includes('--help') || args.includes('-h')) {
    deployer.showHelp();
    process.exit(0);
  }

  if (args.includes('--dry-run')) {
    deployer.log('执行配置检查 (dry-run 模式)...');
    try {
      deployer.checkPrerequisites();
      deployer.checkEnvironment();
      deployer.log('✅ 配置检查通过', 'SUCCESS');
    } catch (error) {
      deployer.log(`❌ 配置检查失败: ${error.message}`, 'ERROR');
      process.exit(1);
    }
    process.exit(0);
  }

  deployer.deploy().catch(error => {
    console.error('部署过程出错:', error);
    process.exit(1);
  });
}

module.exports = CloudBaseDeployer;

