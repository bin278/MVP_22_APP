-- 删除旧表（如果存在）
DROP TABLE IF EXISTS public.generation_tasks CASCADE;

-- 创建异步代码生成任务表
-- 使用双引号保持列名的大小写（驼峰命名）
CREATE TABLE public.generation_tasks (
  id BIGSERIAL PRIMARY KEY,
  "taskId" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  "conversationId" TEXT,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  result JSONB,
  error TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "startedAt" TEXT,
  "completedAt" TEXT
);

-- 创建索引以提高查询性能
CREATE INDEX idx_generation_tasks_taskId ON public.generation_tasks("taskId");
CREATE INDEX idx_generation_tasks_userId ON public.generation_tasks("userId");
CREATE INDEX idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX idx_generation_tasks_createdAt ON public.generation_tasks("createdAt" DESC);

-- 启用行级安全性(RLS)
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取任务(用于查询自己的任务)
CREATE POLICY "Users can view all tasks" ON public.generation_tasks FOR SELECT USING (true);

-- 允许所有用户插入任务(用于创建任务)
CREATE POLICY "Users can insert tasks" ON public.generation_tasks FOR INSERT WITH CHECK (true);

-- 允许所有用户更新任务(用于更新任务状态)
CREATE POLICY "Users can update tasks" ON public.generation_tasks FOR UPDATE USING (true);

-- 允许所有用户删除任务(用于取消任务)
CREATE POLICY "Users can delete tasks" ON public.generation_tasks FOR DELETE USING (true);

-- 添加注释
COMMENT ON TABLE public.generation_tasks IS '异步代码生成任务表';
COMMENT ON COLUMN public.generation_tasks."taskId" IS '任务唯一标识符';
COMMENT ON COLUMN public.generation_tasks."userId" IS '用户ID';
COMMENT ON COLUMN public.generation_tasks."conversationId" IS '对话ID(可选)';
COMMENT ON COLUMN public.generation_tasks.prompt IS '用户输入的提示词';
COMMENT ON COLUMN public.generation_tasks.model IS '使用的AI模型';
COMMENT ON COLUMN public.generation_tasks.status IS '任务状态: pending/running/completed/failed/cancelled';
COMMENT ON COLUMN public.generation_tasks.progress IS '任务进度 0-100';
COMMENT ON COLUMN public.generation_tasks.result IS '生成结果(JSON格式)';
COMMENT ON COLUMN public.generation_tasks.error IS '错误信息(如果失败)';
COMMENT ON COLUMN public.generation_tasks."createdAt" IS '创建时间';
COMMENT ON COLUMN public.generation_tasks."updatedAt" IS '更新时间';
COMMENT ON COLUMN public.generation_tasks."startedAt" IS '开始处理时间';
COMMENT ON COLUMN public.generation_tasks."completedAt" IS '完成时间';
