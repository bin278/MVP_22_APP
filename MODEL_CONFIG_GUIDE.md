# 🚀 模型API密钥配置指南

## 🎯 问题分析

你完全正确！升级后无法使用其他模型的原因是**缺少相应模型的API密钥配置**。

目前系统配置情况：
- ✅ **DeepSeek**: 已配置 (支持免费版和基础版)
- ❌ **OpenAI**: 未配置 (GPT-4需要)
- ❌ **Anthropic**: 未配置 (Claude需要)

## 📋 配置步骤

### 1. 获取 OpenAI API 密钥 (用于GPT-4)

1. **访问 OpenAI Platform**:
   ```
   https://platform.openai.com/
   ```

2. **创建 API 密钥**:
   - 登录账户
   - 进入 "API Keys" 页面
   - 点击 "Create new secret key"
   - 复制生成的密钥 (格式: `sk-...`)

3. **添加到环境变量**:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-key-here
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

### 2. 获取 Anthropic API 密钥 (用于Claude)

1. **访问 Anthropic Console**:
   ```
   https://console.anthropic.com/
   ```

2. **创建 API 密钥**:
   - 登录账户
   - 进入 "API Keys" 页面
   - 点击 "Create Key"
   - 复制生成的密钥 (格式: `sk-ant-...`)

3. **添加到环境变量**:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
   ANTHROPIC_BASE_URL=https://api.anthropic.com
   ```

### 3. 更新 .env.local 文件

在项目的 `.env.local` 文件中添加以下配置：

```env
# -------- OpenAI API 配置 --------
OPENAI_API_KEY=sk-your-actual-openai-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

# -------- Anthropic API 配置 --------
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

## 🎯 订阅等级与可用模型

配置完成后，各等级可用的模型：

### 免费版 (Free)
- ✅ DeepSeek Chat

### 基础版 (Basic) - $99.99/年
- ✅ DeepSeek Chat
- ✅ DeepSeek Coder

### 专业版 (Pro) - $299.99/年
- ✅ DeepSeek Chat
- ✅ DeepSeek Coder
- ✅ GPT-4 (需要OpenAI密钥)
- ✅ Claude 3 Sonnet (需要Anthropic密钥)

### 旗舰版 (Premium) - $999.99/年
- ✅ DeepSeek Chat
- ✅ DeepSeek Coder
- ✅ GPT-4 (需要OpenAI密钥)
- ✅ GPT-4 Turbo (需要OpenAI密钥)
- ✅ Claude 3 Opus (需要Anthropic密钥)
- ✅ Claude 3 Sonnet (需要Anthropic密钥)

## 🧪 测试配置

### 1. 验证配置
```bash
node check-models.js
```

### 2. 重启开发服务器
```bash
# 停止服务器 (Ctrl+C)
npm run dev
```

### 3. 测试模型访问
1. 访问 `http://localhost:3000/profile`
2. 使用测试按钮设置专业版或旗舰版
3. 访问 `http://localhost:3000/generate`
4. 在模型选择器中应该能看到更多模型选项

## 💰 API费用说明

- **DeepSeek**: 相对便宜，适合基础使用
- **OpenAI (GPT-4)**: 中等费用，功能强大
- **Anthropic (Claude)**: 较高费用，最强推理能力

建议根据使用频率和预算选择配置哪些API密钥。

## 🔍 故障排除

### 问题：配置后仍无法使用模型
**检查步骤**:
1. 确认API密钥格式正确
2. 确认账户有足够余额
3. 查看浏览器控制台错误信息
4. 检查服务器日志

### 问题：API调用失败
**可能原因**:
- API密钥无效或过期
- 账户余额不足
- 请求频率过高
- 模型名称不匹配

## 🎉 配置完成后

配置完成后，你的订阅系统将完全可用：

- ✅ 升级到专业版可使用GPT-4和Claude
- ✅ 升级到旗舰版可使用所有高级模型
- ✅ 自动权限验证和模型过滤
- ✅ 按使用量付费，灵活控制成本

现在就开始配置你需要的API密钥吧！🚀












