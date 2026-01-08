-- Supabase 数据库迁移脚本
-- 国际版数据库表结构

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- 用户表
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  name text,
  avatar text,
  subscription_plan text default 'free',
  subscription_status text default 'active',
  region text default 'international',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 创建索引
create index if not exists users_email_idx on users(email);
create index if not exists users_subscription_plan_idx on users(subscription_plan);

-- 对话表
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text,
  type text,
  prompt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 创建索引
create index if not exists conversations_user_id_idx on conversations(user_id);
create index if not exists conversations_type_idx on conversations(type);

-- 对话文件表
create table if not exists conversation_files (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  file_path text,
  file_content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 创建索引
create index if not exists conversation_files_conversation_id_idx on conversation_files(conversation_id);

-- 用户订阅表
create table if not exists user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  plan_type text,
  status text,
  subscription_end timestamptz,
  currency text default 'USD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 创建索引
create index if not exists user_subscriptions_user_id_idx on user_subscriptions(user_id);
create index if not exists user_subscriptions_status_idx on user_subscriptions(status);

-- 支付记录表
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  amount numeric,
  currency text,
  status text,
  payment_method text,
  transaction_id text,
  subscription_id uuid references user_subscriptions(id),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- 创建索引
create index if not exists payments_user_id_idx on payments(user_id);
create index if not exists payments_status_idx on payments(status);
create index if not exists payments_transaction_id_idx on payments(transaction_id);

-- 启用行级安全性 (RLS)
alter table users enable row level security;
alter table conversations enable row level security;
alter table conversation_files enable row level security;
alter table user_subscriptions enable row level security;
alter table payments enable row level security;

-- 创建更新时间戳的函数
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 为各表添加更新时间戳触发器
create trigger update_users_updated_at before update on users
  for each row execute procedure update_updated_at_column();

create trigger update_conversations_updated_at before update on conversations
  for each row execute procedure update_updated_at_column();

create trigger update_conversation_files_updated_at before update on conversation_files
  for each row execute function update_updated_at_column();

create trigger update_user_subscriptions_updated_at before update on user_subscriptions
  for each row execute function update_updated_at_column();

create trigger update_payments_updated_at before update on payments
  for each row execute function update_updated_at_column();

-- 授予服务角色完全访问权限
grant all on all tables in public to service_role;
grant all on all sequences in public to service_role;
grant all on all functions in public to service_role;

-- 插入示例数据 (可选)
-- insert into users (email, name, subscription_plan) values
-- ('test@example.com', 'Test User', 'free');
