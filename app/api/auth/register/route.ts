import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 邮箱格式验证
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    console.log('📝 [Register API] 注册请求:', { email, fullName, provider: process.env.AUTH_PROVIDER });

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必需的' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 根据认证提供商选择注册方式
    const authProvider = process.env.AUTH_PROVIDER || process.env.NEXT_PUBLIC_AUTH_PROVIDER;

    if (authProvider === 'supabase') {
      // ========== Supabase 注册 ==========
      console.log('🌍 [Register API] 使用 Supabase 注册');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ [Register API] Supabase 配置缺失');
        return NextResponse.json(
          { error: 'Supabase 配置缺失' },
          { status: 500 }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 检查邮箱是否已注册
      console.log('🔍 [Register API] 检查邮箱是否已存在...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error('❌ [Register API] 检查邮箱失败:', checkError);
      }

      if (existingUser) {
        console.log('⚠️ [Register API] 邮箱已存在');
        return NextResponse.json(
          { error: '该邮箱已被注册，请使用其他邮箱或直接登录' },
          { status: 409 }
        );
      }

      // 使用 Supabase Auth 注册用户
      console.log('🔐 [Register API] 注册 Supabase 用户...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          }
        }
      });

      if (authError) {
        console.error('❌ [Register API] Supabase Auth 注册失败:', authError);
        return NextResponse.json(
          { error: authError.message || '注册失败' },
          { status: 400 }
        );
      }

      if (!authData.user) {
        console.error('❌ [Register API] 注册失败，用户数据为空');
        return NextResponse.json(
          { error: '注册失败，请稍后重试' },
          { status: 500 }
        );
      }

      // 在 users 表中创建用户记录
      console.log('💾 [Register API] 创建用户记录...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ [Register API] 创建用户记录失败:', userError);
        // 用户已创建但记录失败，仍然返回成功
      }

      console.log('✅ [Register API] 用户注册成功:', authData.user.id);

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: email,
          fullName: fullName || '',
          createdAt: authData.user.created_at
        }
      });

    } else {
      // ========== CloudBase 注册（原有逻辑） ==========
      console.log('🇨🇳 [Register API] 使用 CloudBase 注册');

      const { getDatabase } = await import('@/lib/database/cloudbase');
      const db = getDatabase();

      if (!db) {
        console.error('❌ [Register API] CloudBase 数据库连接不可用');
        return NextResponse.json(
          { error: '数据库连接失败' },
          { status: 500 }
        );
      }

      // 检查邮箱是否已注册
      console.log('🔍 [Register API] 检查邮箱是否已存在...');
      const existingUser = await db.collection('users')
        .where({ email: email })
        .limit(1)
        .get();

      if (existingUser.data && existingUser.data.length > 0) {
        return NextResponse.json(
          { error: '该邮箱已被注册，请使用其他邮箱或直接登录' },
          { status: 409 }
        );
      }

      // 创建用户文档
      const userDoc = {
        email: email,
        password: password, // 注意：生产环境中应该加密存储
        fullName: fullName || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      console.log('💾 [Register API] 创建用户文档...');
      const result = await db.collection('users').add(userDoc);

      console.log('✅ [Register API] 用户注册成功，文档ID:', result.id);

      return NextResponse.json({
        success: true,
        user: {
          id: result.id,
          email: email,
          fullName: fullName || '',
          createdAt: userDoc.createdAt
        }
      });
    }

  } catch (error: any) {
    console.error('❌ [Register API] 注册错误:', error);

    let errorMessage = '注册失败，请稍后重试';
    let statusCode = 500;

    if (error && typeof error === 'object') {
      const errorMsg = error.message || error.msg || error.error || error.code || '';

      // 根据错误类型设置不同的状态码和消息
      if (errorMsg.includes('unauthenticated') || errorMsg.includes('auth')) {
        errorMessage = '认证失败，请检查配置';
        statusCode = 401;
      } else if (errorMsg.includes('permission') || errorMsg.includes('forbidden')) {
        errorMessage = '权限不足，无法访问数据库';
        statusCode = 403;
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}




