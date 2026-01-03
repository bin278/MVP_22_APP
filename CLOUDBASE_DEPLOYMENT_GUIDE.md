# CloudBase 部署完整指南

## 🎯 部署概览

本指南将帮助您完整部署CloudBase认证系统，包括邮箱验证码功能。

## 📋 前置条件

- ✅ CloudBase账户和环境
- ✅ Node.js 环境
- ✅ 已配置环境变量

## 🚀 部署步骤

### 步骤1：验证环境配置

```bash
# 检查环境变量
node -e "console.log('环境ID:', process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID)"
```

确保 `.env.local` 文件包含：
```env
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-5gkes99x7b41ee3f
AUTH_PROVIDER=cloudbase
DATABASE_PROVIDER=cloudbase
```

### 步骤2：启动应用并测试基本功能

```bash
npm run dev
```

访问 `http://localhost:3000`，确认：
- ✅ CloudBase初始化成功
- ✅ 无认证错误
- ✅ 可以访问注册/登录页面

### 步骤3：配置CloudBase控制台

#### **启用邮箱登录**
1. 访问 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境：`cloud1-5gkes99x7b41ee3f`
3. 点击 **"用户管理"** → **"登录设置"**
4. 启用 **"邮箱登录"** ✅

#### **配置邮件模板（可选）**
1. 在用户管理页面找到 **"邮件模板"**
2. 配置验证码邮件模板
3. 设置发件人信息

### 步骤4：部署验证码发送云函数

由于CloudBase前端SDK可能不支持直接发送验证码，我们需要部署云函数：

#### **方法1：控制台部署**
1. 在CloudBase控制台进入 **"云函数"** 页面
2. 点击 **"新建云函数"**
3. 上传项目中的 `cloud-functions/sendEmailVerification` 文件夹
4. 配置函数信息：
   - **函数名称**: `sendEmailVerification`
   - **运行环境**: `Nodejs10` 或更高版本
   - **函数代码**: 上传 `index.js`
   - **依赖文件**: 上传 `package.json`

#### **方法2：CLI部署**
```bash
# 安装CloudBase CLI
npm install -g @cloudbase/cli

# 登录CloudBase
cloudbase login

# 部署云函数
cloudbase functions:deploy sendEmailVerification
```

### 步骤5：测试验证码功能

#### **测试云函数**
在CloudBase控制台测试云函数：
```json
{
  "email": "your-email@example.com"
}
```

#### **测试前端功能**
1. 访问注册页面：`http://localhost:3000/register`
2. 输入邮箱地址
3. 点击 **"发送验证码"**
4. 检查邮箱是否收到验证码邮件

### 步骤6：测试完整注册流程

1. **填写注册信息**
   - 邮箱、密码、确认密码、姓名

2. **发送验证码**
   - 点击"发送验证码"
   - 检查邮箱获取6位验证码

3. **输入验证码**
   - 输入收到的验证码
   - 点击"完成注册"

4. **验证注册成功**
   - 看到成功提示
   - 可以登录系统

## 🔍 故障排除

### 问题1：收不到验证码邮件

**检查步骤**：
1. ✅ CloudBase控制台已启用邮箱登录
2. ✅ 云函数已正确部署
3. ✅ 邮箱地址正确
4. ✅ 检查垃圾邮件文件夹

**解决方案**：
- 部署 `sendEmailVerification` 云函数
- 检查云函数日志
- 验证邮箱服务正常

### 问题2：注册失败

**检查步骤**：
1. ✅ 验证码正确
2. ✅ 密码符合要求
3. ✅ 邮箱未被注册

**解决方案**：
- 检查验证码是否过期
- 确认密码强度要求
- 查看浏览器控制台错误信息

### 问题3：云函数部署失败

**检查步骤**：
1. ✅ CloudBase CLI 已安装
2. ✅ 已登录CloudBase账户
3. ✅ 环境ID正确

**解决方案**：
```bash
# 重新登录
cloudbase login

# 检查环境
cloudbase env:list

# 重新部署
cloudbase functions:deploy sendEmailVerification --force
```

## 📊 功能验证清单

部署完成后，验证以下功能：

- ✅ **邮箱登录启用** - CloudBase控制台
- ✅ **云函数部署** - sendEmailVerification
- ✅ **验证码发送** - 注册页面测试
- ✅ **验证码接收** - 检查邮箱
- ✅ **完整注册** - 邮箱验证 + 密码设置
- ✅ **登录功能** - 使用注册的账号

## 🎉 部署完成

恭喜！CloudBase认证系统已完全部署。您现在拥有：

- 🔐 **安全的邮箱认证**
- 📧 **验证码邮件发送**
- 👤 **用户注册和登录**
- ☁️ **云端数据存储**

## 📞 支持与帮助

- **CloudBase文档**: https://docs.cloudbase.net/
- **问答社区**: https://support.qq.com/products/148793
- **故障排除**: 查看 `CLOUDBASE_EMAIL_TROUBLESHOOTING.md`

---

**部署时间**: 约15-30分钟
**难度等级**: 中等
**技术栈**: CloudBase + Next.js + React




