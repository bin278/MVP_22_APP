# Admin后台实现指南

本文档详细说明如何实现一个基于Next.js的管理后台系统，包括认证、权限控制、数据统计等核心功能。

## 目录结构

```
app/
├── admin/
│   ├── layout.tsx              # Admin布局（侧边栏、导航）
│   ├── page.tsx                # Admin首页（重定向到stats）
│   ├── login/
│   │   ├── layout.tsx          # 登录页布局
│   │   └── page.tsx            # 登录页面
│   ├── stats/
│   │   └── page.tsx            # 数据统计页面
│   ├── ads/
│   │   └── page.tsx            # 广告管理
│   ├── orders/
│   │   └── page.tsx            # 订单管理
│   ├── releases/
│   │   └── page.tsx            # 版本发布管理
│   ├── social-links/
│   │   └── page.tsx            # 社交链接管理
│   └── components/
│       └── AdminSidebar.tsx    # 侧边栏组件
├── middleware.ts               # 路由中间件（认证保护）
├── actions/
│   ├── admin-auth.ts           # 认证相关Server Actions
│   ├── admin-stats.ts          # 统计数据Server Actions
│   ├── admin-ads.ts            # 广告管理Server Actions
│   ├── admin-orders.ts         # 订单管理Server Actions
│   ├── admin-releases.ts       # 版本管理Server Actions
│   └── admin-social-links.ts  # 社交链接Server Actions
└── utils/
    └── session.ts              # Session管理工具
```

## 核心功能实现

### 1. 认证系统

#### 1.1 Session管理 (`utils/session.ts`)

使用HttpOnly Cookie实现安全的会话管理：

```typescript
// Session接口定义
interface AdminSession {
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

// 核心函数
- createAdminSession(userId, username): 创建会话
- getAdminSession(): 获取当前会话
- verifyAdminSession(): 验证会话有效性
- destroyAdminSession(): 销毁会话（登出）
- verifyAdminSessionToken(token): 验证token（用于中间件）
```

**实现要点：**
- 使用Base64编码+简单签名（生产环境建议使用JWT）
- Cookie配置：httpOnly=true, secure=production, sameSite=lax
- Session过期时间：24小时
- 环境变量：`ADMIN_SESSION_SECRET`（生产环境必须）

#### 1.2 登录页面 (`app/admin/login/page.tsx`)

**功能：**
- 用户名/密码表单
- 客户端表单验证
- 调用Server Action进行认证
- 登录成功后重定向到 `/admin/stats`

**关键代码结构：**
```typescript
"use client";
import { adminLogin } from "@/actions/admin-auth";

async function handleSubmit(formData: FormData) {
  const result = await adminLogin(formData);
  if (result.success) {
    router.push("/admin/stats");
  }
}
```

#### 1.3 认证Server Action (`actions/admin-auth.ts`)

**需要实现的函数：**
- `adminLogin(formData)`: 验证用户名密码，创建session
- `adminLogout()`: 销毁session，重定向到登录页

### 2. 路由保护（Middleware）

在 `middleware.ts` 中实现Admin路由保护：

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin路由保护
  if (pathname.startsWith("/admin")) {
    // 登录页不需要验证
    if (!pathname.startsWith("/admin/login")) {
      const sessionToken = request.cookies.get("admin_session")?.value;

      if (!sessionToken || !verifyAdminSessionToken(sessionToken)) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // 设置pathname header供layout使用
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  return NextResponse.next();
}
```

**保护逻辑：**
1. 检测访问 `/admin/*` 路径
2. 排除 `/admin/login` 页面
3. 验证session cookie
4. 无效则重定向到登录页
5. 有效则放行并设置pathname header

### 3. Admin布局系统

#### 3.1 根布局 (`app/admin/layout.tsx`)

**功能：**
- 检查当前路径，登录页不显示侧边栏
- 获取session信息传递给侧边栏
- 响应式布局：桌面端固定侧边栏，移动端顶部+底部导航

**布局结构：**
```typescript
export default async function AdminLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // 登录页直接渲染children
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <AdminSidebar username={session.username} />
        <main className="flex-1 md:ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 3.2 侧边栏组件 (`app/admin/components/AdminSidebar.tsx`)

**功能特性：**
- 响应式设计：
  - 桌面端：固定左侧侧边栏（w-64）
  - 移动端：顶部导航栏 + 底部Tab导航 + 抽屉式侧边栏
- 导航菜单项配置
- 当前路由高亮
- 用户信息显示
- 登出功能

**导航配置：**
```typescript
const navItems = [
  { href: "/admin/stats", label: "统计", icon: BarChart3 },
  { href: "/admin/ads", label: "广告", icon: Megaphone },
  { href: "/admin/social-links", label: "链接", icon: LinkIcon },
  { href: "/admin/releases", label: "版本", icon: Package },
  { href: "/admin/orders", label: "订单", icon: ShoppingCart },
];
```

### 4. 数据统计页面

#### 4.1 统计页面 (`app/admin/stats/page.tsx`)

**核心功能：**
- 数据源切换：全部/国际版/国内版
- 实时数据刷新
- 多维度统计卡片
- 数据可视化图表

**统计维度：**
1. **用户统计**
   - 总用户数、今日/本周/本月新增
   - DAU/WAU/MAU（日活/周活/月活）

2. **收入统计**
   - 总收入（美元+人民币）
   - 今日/本周/本月收入
   - 支持按数据源筛选

3. **订阅统计**
   - 订阅用户总数
   - 转化率
   - 已付款订单数

4. **趋势图表**
   - 用户趋势：活跃用户、新增用户、构建数
   - 收入趋势：每日收入柱状图
   - 设备分布：设备类型、操作系统饼图
   - 订阅分布：订阅计划饼图

**使用的图表库：**
- recharts（LineChart, BarChart, PieChart）

#### 4.2 统计数据Server Actions (`actions/admin-stats.ts`)

**需要实现的函数：**
```typescript
// 获取仪表盘统计数据
getDashboardStats(source: "all" | "global" | "cn"): Promise<DashboardStats>

// 获取每日活跃用户数据
getDailyActiveUsers(source, timeRange): Promise<DailyStats[]>

// 获取每日收入数据
getDailyRevenue(source, timeRange): Promise<RevenueStats[]>
```

**数据结构：**
```typescript
interface DashboardStats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    dau: number;
    wau: number;
    mau: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenueCny: { /* 同上 */ };
  subscriptions: {
    total: number;
    byPlan: Record<string, number>;
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
  };
  devices: {
    byDeviceType: Record<string, number>;
    byOs: Record<string, number>;
  };
}
```

### 5. 其他管理页面

#### 5.1 广告管理 (`app/admin/ads/page.tsx`)
- 广告列表展示
- 创建/编辑/删除广告
- 广告状态管理（启用/禁用）
- 广告位置配置

#### 5.2 订单管理 (`app/admin/orders/page.tsx`)
- 订单列表（分页、筛选）
- 订单详情查看
- 订单状态更新
- 支付信息查看

#### 5.3 版本发布管理 (`app/admin/releases/page.tsx`)
- 版本列表
- 创建新版本
- 版本详情编辑
- 发布状态管理

#### 5.4 社交链接管理 (`app/admin/social-links/page.tsx`)
- 社交链接列表
- 添加/编辑/删除链接
- 链接排序
- 显示/隐藏控制

## 实现步骤

### 第一步：搭建基础架构

1. **创建目录结构**
   ```bash
   mkdir -p app/admin/{login,stats,ads,orders,releases,social-links,components}
   mkdir -p actions utils
   ```

2. **配置环境变量**
   ```env
   ADMIN_SESSION_SECRET=your-secret-key-here
   ```

3. **安装依赖**
   ```bash
   npm install recharts lucide-react
   ```

### 第二步：实现认证系统

1. 创建 `utils/session.ts` - Session管理工具
2. 创建 `actions/admin-auth.ts` - 认证Server Actions
3. 创建 `app/admin/login/page.tsx` - 登录页面
4. 在 `middleware.ts` 中添加Admin路由保护

### 第三步：实现布局系统

1. 创建 `app/admin/layout.tsx` - Admin根布局
2. 创建 `app/admin/components/AdminSidebar.tsx` - 侧边栏组件
3. 创建 `app/admin/page.tsx` - 首页重定向

### 第四步：实现数据统计

1. 创建 `actions/admin-stats.ts` - 统计数据Server Actions
2. 创建 `app/admin/stats/page.tsx` - 统计页面
3. 实现数据查询逻辑（连接数据库）
4. 实现图表展示

### 第五步：实现其他管理功能

1. 依次实现广告、订单、版本、社交链接管理页面
2. 为每个功能创建对应的Server Actions
3. 实现CRUD操作

## 技术栈

- **框架**: Next.js 14+ (App Router)
- **UI组件**: shadcn/ui
- **图表**: recharts
- **图标**: lucide-react
- **样式**: Tailwind CSS
- **数据库**: Supabase（或其他）
- **认证**: 自定义Session（Cookie-based）

## 安全考虑

1. **Session安全**
   - 使用HttpOnly Cookie防止XSS攻击
   - 生产环境强制HTTPS（secure flag）
   - 定期刷新session
   - 设置合理的过期时间

2. **中间件保护**
   - 所有admin路由必须经过认证
   - 验证失败立即重定向
   - 防止未授权访问

3. **Server Actions**
   - 所有数据操作在服务端执行
   - 验证用户权限
   - 输入验证和清理
   - 防止SQL注入

4. **环境变量**
   - 敏感信息存储在环境变量
   - 生产环境强制检查必需变量
   - 不在客户端暴露密钥

## 性能优化

1. **数据加载**
   - 使用Server Components减少客户端JS
   - 并行加载多个数据源
   - 实现数据缓存策略

2. **图表渲染**
   - 使用ResponsiveContainer自适应
   - 限制数据点数量
   - 按需加载图表组件

3. **响应式设计**
   - 移动端优化布局
   - 减少移动端数据加载
   - 使用CSS媒体查询

## 扩展建议

1. **权限系统**
   - 实现角色管理（超级管理员、普通管理员）
   - 细粒度权限控制
   - 操作日志记录

2. **数据导出**
   - 支持CSV/Excel导出
   - 自定义报表生成
   - 定时报表邮件

3. **实时通知**
   - WebSocket实时数据更新
   - 重要事件通知
   - 系统告警

4. **审计日志**
   - 记录所有管理操作
   - 操作人、时间、内容
   - 日志查询和分析

## 常见问题

### Q: 如何添加新的管理页面？

1. 在 `app/admin/` 下创建新目录和 `page.tsx`
2. 在 `AdminSidebar.tsx` 的 `navItems` 中添加导航项
3. 创建对应的Server Actions文件
4. 实现数据查询和操作逻辑

### Q: 如何修改session过期时间？

修改 `utils/session.ts` 中的 `SESSION_MAX_AGE` 常量。

### Q: 如何支持多管理员？

1. 创建管理员数据表
2. 在 `admin-auth.ts` 中查询数据库验证
3. 在session中存储管理员ID和权限
4. 在各个操作中验证权限

### Q: 如何实现数据实时刷新？

1. 使用 `setInterval` 定时调用Server Actions
2. 或使用WebSocket推送更新
3. 或使用SWR/React Query实现自动重新验证

## 总结

本指南提供了一个完整的Admin后台实现方案，包括：
- 安全的认证系统
- 灵活的布局架构
- 丰富的数据统计
- 完善的管理功能

按照本指南实施，可以快速搭建一个功能完善、安全可靠的管理后台系统。
