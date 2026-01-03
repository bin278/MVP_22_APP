/**
 * Supabase 管理客户端
 * 注意：这是一个临时的兼容性模块，中国版项目主要使用 CloudBase
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 管理客户端（仅用于兼容性）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 注意：这个模块仅用于兼容性，中国版项目应使用 CloudBase
// 如果需要完整的 Supabase 管理功能，请配置 SUPABASE_SERVICE_ROLE_KEY













