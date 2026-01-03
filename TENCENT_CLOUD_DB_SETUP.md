# 腾讯云数据库配置指南

## 概述

本项目支持将支付数据迁移到腾讯云数据库。目前支持腾讯云PostgreSQL数据库。

## 腾讯云数据库购买和配置

### 1. 购买腾讯云PostgreSQL数据库

1. 访问 [腾讯云PostgreSQL控制台](https://console.cloud.tencent.com/postgresql)
2. 点击"新建实例"
3. 选择以下配置：
   - **地域**：选择离用户最近的地域（如广州、上海、北京）
   - **可用区**：选择任意可用区
   - **数据库版本**：PostgreSQL 14 或 15（推荐最新稳定版）
   - **规格**：根据需要选择，起步配置即可
   - **存储**：起步10GB，根据需要调整
   - **网络**：VPC网络（推荐）
   - **安全组**：创建新安全组或使用默认

### 2. 配置数据库实例

创建完成后，进入实例详情页：

1. **设置密码**：点击"重置密码"设置管理员密码
2. **创建数据库**：在"数据库管理"中创建新数据库
3. **配置安全组**：允许应用服务器IP访问数据库端口（默认5432）

### 3. 获取连接信息

在实例详情页获取以下信息：

- **内网地址**：用于VPC内访问
- **外网地址**：用于外网访问（开发环境）
- **端口**：默认5432
- **数据库名**：创建的数据库名称
- **用户名**：默认postgres
- **密码**：设置的管理员密码

## 环境变量配置

在项目根目录创建或更新 `.env.local` 文件：

```env
# 腾讯云数据库配置
TENCENT_CLOUD_DB_HOST=your_instance_address.tencentcdb.com
TENCENT_CLOUD_DB_PORT=5432
TENCENT_CLOUD_DB_NAME=your_database_name
TENCENT_CLOUD_DB_USER=postgres
TENCENT_CLOUD_DB_PASSWORD=your_password

# 数据库连接池配置（可选）
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

### 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TENCENT_CLOUD_DB_HOST` | 数据库实例地址 | `pg-xxxx.tencentcdb.com` |
| `TENCENT_CLOUD_DB_PORT` | 数据库端口 | `5432` |
| `TENCENT_CLOUD_DB_NAME` | 数据库名称 | `mvp_db` |
| `TENCENT_CLOUD_DB_USER` | 用户名 | `postgres` |
| `TENCENT_CLOUD_DB_PASSWORD` | 密码 | `your_password` |
| `DB_POOL_MAX` | 连接池最大连接数 | `20` |
| `DB_IDLE_TIMEOUT` | 空闲连接超时时间(ms) | `30000` |
| `DB_CONNECTION_TIMEOUT` | 连接超时时间(ms) | `2000` |

## 数据库表结构

### 支付表 (payments)

```sql
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
```

### 用户订阅表 (user_subscriptions)

```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
```

## 数据库迁移步骤

### 1. 备份现有数据（如果有）

如果您之前使用Supabase存储了数据，请先备份：

```bash
# 导出Supabase数据
pg_dump "postgresql://[username]:[password]@[host]:[port]/[database]" > supabase_backup.sql
```

### 2. 创建腾讯云数据库表

连接到腾讯云数据库并执行上述SQL语句创建表结构。

### 3. 更新应用配置

修改 `lib/database/index.ts` 或相关文件，将数据库切换到腾讯云：

```typescript
// 使用腾讯云数据库
export { tencentCloudDB as supabaseAdmin } from './tencent-cloud';
```

### 4. 测试连接

运行测试确保连接正常：

```typescript
import { testConnection } from './lib/database/tencent-cloud';

// 测试数据库连接
testConnection().then(success => {
  if (success) {
    console.log('✅ 腾讯云数据库连接成功');
  } else {
    console.log('❌ 腾讯云数据库连接失败');
  }
});
```

## 安全配置

### 1. 网络安全

- **生产环境**：使用内网连接，应用服务器和数据库在同一VPC
- **开发环境**：配置安全组只允许特定IP访问

### 2. 数据库安全

- **强密码**：使用复杂密码
- **定期更换**：定期更换数据库密码
- **最小权限**：创建专门的用户，只授予必要权限

### 3. 应用安全

- **环境变量**：不要在代码中硬编码数据库信息
- **加密传输**：启用SSL连接
- **连接池**：使用连接池避免连接泄露

## 监控和维护

### 1. 监控指标

腾讯云控制台提供以下监控：
- CPU使用率
- 内存使用率
- 磁盘使用率
- 连接数
- QPS

### 2. 备份策略

- **自动备份**：腾讯云提供自动备份功能
- **手动备份**：定期手动备份重要数据
- **跨地域备份**：异地容灾备份

### 3. 性能优化

- **索引优化**：根据查询模式创建适当索引
- **连接池调优**：根据应用负载调整连接池参数
- **查询优化**：优化慢查询

## 故障排除

### 连接失败

1. 检查网络连通性：`telnet host port`
2. 验证安全组配置
3. 确认用户名密码正确
4. 检查数据库实例状态

### 性能问题

1. 查看慢查询日志
2. 检查索引使用情况
3. 调整连接池参数
4. 考虑升级实例规格

### 数据迁移问题

1. 确保字符编码一致
2. 检查数据类型兼容性
3. 验证外键约束
4. 测试应用功能完整性

## 费用说明

腾讯云PostgreSQL费用包括：
- **实例费用**：按小时计费，根据规格不同
- **存储费用**：按GB月计费
- **备份费用**：按GB月计费
- **网络费用**：内网免费，外网按流量计费

建议先使用按量计费模式，确认配置满足需求后再购买包年包月。




