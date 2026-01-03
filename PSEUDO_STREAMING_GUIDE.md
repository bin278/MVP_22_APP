# 伪流式代码生成系统 - CloudBase适配指南

## 🎯 核心特性

完全适配腾讯云CloudBase个人版，彻底解决60秒同步超时限制：

- ✅ **无超时风险**：任务创建<1秒，AI生成异步执行
- ✅ **流式体验**：前端短轮询+打字机效果，视觉无差异
- ✅ **数据隔离**：JWT+openid确保用户数据安全
- ✅ **零配置**：无需修改CloudBase任何配置
- ✅ **高可用**：自动重试，网络异常兜底

## 🚀 部署步骤

### 1. 创建CloudBase数据库集合

1. 登录 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境 → 「数据库」
3. 点击「创建集合」，输入集合名：`ai_code_tasks`
4. 集合会自动创建，无需手动添加字段

### 2. 环境变量配置

在CloudBase控制台的环境变量中确保以下配置：

```bash
# AI API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7

# JWT配置
JWT_SECRET=your_secure_jwt_secret

# CloudBase配置
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=your_env_id
TENCENT_CLOUD_SECRET_ID=your_secret_id
TENCENT_CLOUD_SECRET_KEY=your_secret_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. 部署代码

代码已自动推送到GitHub，CloudBase会自动触发重新部署。

## 📋 API接口说明

### POST /api/create-code-task
创建代码生成任务

**请求参数：**
```json
{
  "prompt": "创建一个React计数器组件"
}
```

**响应：**
```json
{
  "code": 0,
  "msg": "任务已启动",
  "data": {
    "taskId": "uuid-string"
  }
}
```

### GET /api/query-code-task
查询任务状态和代码

**请求参数：**
```
?taskId=your-task-id
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "code": "生成的代码内容",
    "status": "processing|success|failed",
    "errorMsg": "错误信息（失败时）"
  }
}
```

## 🔧 前端集成说明

### 核心流程

1. **创建任务**：调用`/api/create-code-task`，立即返回TaskID
2. **开始轮询**：每1秒调用`/api/query-code-task?taskId=xxx`
3. **增量渲染**：对比本地代码和最新代码，仅渲染新增部分
4. **打字机效果**：逐字符显示，模拟真实流式体验

### 关键代码片段

```javascript
// 1. 创建任务
const createTask = async (prompt) => {
  const response = await fetch('/api/create-code-task', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authSession?.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  const result = await response.json();
  return result.data.taskId;
};

// 2. 轮询查询
const pollTask = async (taskId) => {
  const response = await fetch(`/api/query-code-task?taskId=${taskId}`, {
    headers: {
      'Authorization': `Bearer ${authSession?.accessToken}`
    }
  });

  const result = await response.json();
  return result.data;
};

// 3. 增量渲染
let renderedCode = '';
const renderIncremental = (latestCode) => {
  const incremental = latestCode.slice(renderedCode.length);
  if (incremental) {
    // 打字机效果显示增量代码
    for (let char of incremental) {
      setTimeout(() => {
        setStreamingCode(prev => prev + char);
      }, 50); // 50ms间隔
    }
    renderedCode = latestCode;
  }
};
```

## 🧪 测试验证

### 运行测试脚本

```bash
# 设置环境变量
export TEST_JWT_TOKEN="your-actual-jwt-token"

# 运行测试
node scripts/test-pseudo-streaming.js
```

### 预期测试结果

```
🧪 开始测试伪流式代码生成系统
1️⃣ 测试创建任务...
✅ 创建任务成功
   TaskID: abc-123-def-456

2️⃣ 测试轮询查询...
   第1次轮询... 状态: processing, 代码长度: 50
   第2次轮询... 状态: processing, 代码长度: 150
   第3次轮询... 状态: success, 代码长度: 300
✅ 生成完成！

3️⃣ 测试数据隔离...
✅ 数据隔离正常：无法访问不存在的任务

🎉 所有测试通过！
```

## ⚠️ 注意事项

### 1. JWT Token获取
测试前需要获取有效的JWT Token：
1. 登录应用，打开浏览器开发者工具
2. 在Application → Local Storage中找到token
3. 复制token值设置到环境变量

### 2. 数据库权限
确保CloudBase数据库集合`ai_code_tasks`有读写权限。

### 3. 超时设置
虽然系统已适配60秒超时，但建议在CloudBase控制台将超时时间设置为600秒以获得更好体验。

## 🔍 故障排除

### 问题1：创建任务失败
```
❌ 创建任务失败: CloudBase SDK未加载
```
**解决**：检查CloudBase环境变量配置是否正确。

### 问题2：轮询失败
```
❌ 查询失败: 任务不存在
```
**解决**：检查JWT Token是否有效，确认用户有权限访问该任务。

### 问题3：生成超时
```
⏰ 轮询超时
```
**解决**：AI生成可能遇到问题，检查DeepSeek API密钥和网络连接。

## 🎉 优势总结

| 特性 | 传统流式 | 伪流式方案 |
|------|----------|------------|
| 超时风险 | 高（60秒限制） | 无（异步执行） |
| 实现复杂度 | 高（SSE/WebSocket） | 低（轮询+增量） |
| 网络稳定性 | 差（长连接易断） | 优（短连接+重试） |
| CloudBase兼容性 | 差（需特殊配置） | 优（开箱即用） |
| 用户体验 | 流畅 | 接近流畅 |

这套方案完美解决了CloudBase个人版的超时限制，同时保持了良好的用户体验，是当前场景下的最优解！





