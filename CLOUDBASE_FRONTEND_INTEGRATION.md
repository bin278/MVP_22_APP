# CloudBase前端SDK集成指南

## 概述

由于CloudBase Node.js SDK的管理接口不支持直接用户认证操作，需要在前端使用CloudBase Web SDK来实现完整的认证功能。

## 安装依赖

```bash
npm install @cloudbase/js-sdk
```

## API兼容性说明

**重要：** CloudBase Web SDK的API方法名可能因版本而异。本集成代码实现了兼容性检查，会自动尝试多种方法名以确保功能正常工作。

### 支持的方法名变体

- **注册**: `signUp` (推荐) 或 `signUpWithEmailAndPassword`
- **登录**: `signIn` (推荐) 或 `signInWithEmailAndPassword`
- **状态监听**: `onLoginStateChanged` (推荐) 或 `onAuthStateChanged`
- **微信登录**: `signInWithWeixin` 或 `signIn`
- **密码重置**: `sendPasswordResetEmail`
- **登出**: `signOut`

代码会自动检测可用的方法并使用相应的API。

## 初始化CloudBase应用

创建 `lib/cloudbase-frontend.ts` 文件：

```typescript
import cloudbase from '@cloudbase/js-sdk';

// CloudBase应用实例
let app: any = null;

// 初始化CloudBase应用
export function initializeCloudBase() {
  if (!app && typeof window !== 'undefined') {
    app = cloudbase.init({
      env: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || 'your-env-id',
      region: 'ap-shanghai', // 根据实际情况设置地域
    });
    console.log('CloudBase前端SDK初始化成功');
  }
  return app;
}

// 获取CloudBase应用实例
export function getCloudBaseApp() {
  if (!app) {
    return initializeCloudBase();
  }
  return app;
}

// 获取认证实例
export function getAuth() {
  const app = getCloudBaseApp();
  return app?.auth();
}

// 获取数据库实例
export function getDatabase() {
  const app = getCloudBaseApp();
  return app?.database();
}
```

## 认证功能实现

### 1. 用户注册

```typescript
import { getAuth } from '@/lib/cloudbase-frontend';

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('CloudBase未初始化');
    }

    // CloudBase Web SDK的注册方法
    let result;

    if (typeof auth.signUp === 'function') {
      // 方法1: signUp (推荐)
      result = await auth.signUp({
        username: email.split('@')[0], // 使用邮箱前缀作为用户名
        password: password,
        email: email
      });
    } else if (typeof auth.signUpWithEmailAndPassword === 'function') {
      // 方法2: signUpWithEmailAndPassword (兼容)
      result = await auth.signUpWithEmailAndPassword(email, password);
    } else {
      throw new Error('CloudBase SDK不支持注册功能');
    }

    console.log('注册成功:', result.user || result);
    return {
      success: true,
      user: {
        uid: result.user?.uid || result.uid,
        email: result.user?.email || email,
        createTime: result.user?.createTime || new Date().toISOString(),
      }
    };
  } catch (error: any) {
    console.error('注册失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 2. 用户登录

```typescript
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('CloudBase未初始化');
    }

    const result = await auth.signInWithEmailAndPassword(email, password);

    console.log('登录成功:', result.user);
    return {
      success: true,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        createTime: result.user.createTime,
      },
      credential: result.credential
    };
  } catch (error: any) {
    console.error('登录失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 3. 密码重置

```typescript
export const resetPassword = async (email: string) => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('CloudBase未初始化');
    }

    await auth.sendPasswordResetEmail(email);

    console.log('密码重置邮件已发送');
    return { success: true };
  } catch (error: any) {
    console.error('密码重置失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 4. 第三方登录（微信）

```typescript
export const signInWithWechat = async () => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('CloudBase未初始化');
    }

    // 需要先在CloudBase控制台配置微信登录
    const result = await auth.signInWithWeixin();

    console.log('微信登录成功:', result.user);
    return {
      success: true,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        nickname: result.user.nickname,
        avatar: result.user.avatar,
      },
      credential: result.credential
    };
  } catch (error: any) {
    console.error('微信登录失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 5. 监听认证状态

```typescript
export const setupAuthStateListener = (callback: (user: any) => void) => {
  const auth = getAuth();
  if (!auth) {
    console.error('CloudBase未初始化');
    return null;
  }

  // 监听认证状态变化
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('用户已登录:', user.email);
      callback({
        uid: user.uid,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        createTime: user.createTime,
        updateTime: user.updateTime,
      });
    } else {
      console.log('用户未登录');
      callback(null);
    }
  });

  return unsubscribe; // 返回取消监听的函数
};
```

### 6. 用户登出

```typescript
export const signOut = async () => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('CloudBase未初始化');
    }

    await auth.signOut();
    console.log('登出成功');
    return { success: true };
  } catch (error: any) {
    console.error('登出失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## 集成到Next.js应用

### 1. 创建认证上下文

更新 `lib/auth-context.tsx`：

```typescript
import { signUpWithEmail, signInWithEmail, signOut, resetPassword, signInWithWechat, setupAuthStateListener } from '@/lib/cloudbase-frontend';

// 修改signUp函数
const signUp = async (email: string, password: string, userData?: { full_name?: string; username?: string }) => {
  const result = await signUpWithEmail(email, password);
  if (result.success && result.user) {
    setUser(result.user);
    return { error: null };
  } else {
    return { error: { message: result.error } };
  }
};

// 修改signIn函数
const signIn = async (email: string, password: string) => {
  const result = await signInWithEmail(email, password);
  if (result.success && result.user) {
    setUser(result.user);
    setSession(result.credential);
    return { error: null };
  } else {
    return { error: { message: result.error } };
  }
};

// 修改signOut函数
const signOut = async () => {
  const result = await signOut();
  if (result.success) {
    setUser(null);
    setSession(null);
  }
};

// 修改resetPassword函数
const resetPassword = async (email: string) => {
  const result = await resetPassword(email);
  if (result.success) {
    return { error: null };
  } else {
    return { error: { message: result.error } };
  }
};

// 在组件挂载时设置认证状态监听
useEffect(() => {
  const unsubscribe = setupAuthStateListener((user) => {
    setUser(user);
    setLoading(false);
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, []);
```

### 2. 初始化CloudBase

在 `_app.tsx` 或 `layout.tsx` 中初始化：

```typescript
import { initializeCloudBase } from '@/lib/cloudbase-frontend';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    initializeCloudBase();
  }, []);

  return <Component {...pageProps} />;
}
```

## 环境变量配置

确保 `.env.local` 文件包含：

```env
# CloudBase前端配置
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=your-environment-id

# CloudBase后端配置（用于API调用）
TENCENT_CLOUD_SECRET_ID=your_secret_id
TENCENT_CLOUD_SECRET_KEY=your_secret_key
TENCENT_CLOUD_ENV_ID=your_environment_id
```

## CloudBase控制台配置

### 1. 启用认证服务

1. 进入CloudBase控制台
2. 选择你的环境
3. 进入"用户管理" → "登录设置"
4. 启用邮箱登录

### 2. 配置第三方登录（可选）

1. 在"登录设置"中配置微信登录
2. 提供微信开放平台的AppID和AppSecret

### 3. 邮箱模板配置（可选）

1. 在"用户管理"中配置邮件模板
2. 设置密码重置邮件的模板

## 错误处理

### 常见错误

1. **CloudBase未初始化**
   ```
   确保在组件挂载时调用了 initializeCloudBase()
   ```

2. **环境ID错误**
   ```
   检查 NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 是否正确
   ```

3. **权限不足**
   ```
   确保在CloudBase控制台中启用了相应功能
   ```

4. **网络错误**
   ```
   检查防火墙和网络连接
   ```

## 完整示例

参考项目的注册和登录页面代码，结合上述CloudBase前端SDK集成指南，实现完整的用户认证功能。

## 总结

通过CloudBase前端SDK集成，可以实现完整的用户认证功能，包括注册、登录、密码重置和第三方登录。Node.js管理接口主要用于服务端的数据管理和API调用。
