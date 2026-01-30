import { NextRequest, NextResponse } from 'next/server';
import { upsertUser } from '@/lib/auth/supabase-auth';
import { getSupabaseAdmin } from '@/lib/database/supabase';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // 验证token并获取用户
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 同步用户数据到users表
    await upsertUser({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url,
    });

    // 更新last_active_at
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
