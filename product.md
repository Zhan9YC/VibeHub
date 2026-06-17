你是一名资深全栈工程师和产品架构师。请严格按照以下详细规格，生成一个名为 **VibeHub** 的完整可运行 Web 应用项目。你必须同时保证前端视觉、后端逻辑、数据库设计、安全策略和交互细节的正确性。

## 1. 项目概述
VibeHub 是一个面向“Vibecoding”（AI 生成应用）的应用市场与社区，核心功能是：
- 创造者发布应用
- 用户浏览、使用、评价应用
- Remix 生态（基于他人应用二次创作并溯源）
- 打赏/付费（初期占位）

## 2. 技术栈
- Next.js 14 (App Router)，使用 React Server Components 和数据获取
- TypeScript
- Tailwind CSS + shadcn/ui + framer-motion
- Supabase：Auth、PostgreSQL、Storage
- Stripe Connect（仅前端占位）
- 字体：Inter + Space Grotesk

## 3. 数据库设计与业务逻辑

### 3.1 表结构（必须在生成的 SQL 文件中包含）
```sql
-- 启用 uuid-ossp 扩展
create extension if not exists "uuid-ossp";

-- 1. 用户资料表（与 Supabase Auth 关联）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  twitter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 应用表
create table public.apps (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slogan text,
  description text,
  category text not null,
  tech_stack text[] default '{}',
  license text,
  screenshots text[] default '{}',
  demo_url text,
  prompt_text text,
  remix_allowed boolean default true,
  remix_license text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. 评论与评分表
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(app_id, user_id) -- 一人对一个应用只能评价一次
);

-- 4. Remix 关系表
create table public.remixes (
  id uuid default gen_random_uuid() primary key,
  parent_app_id uuid references public.apps(id) on delete cascade not null,
  child_app_id uuid references public.apps(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(parent_app_id, child_app_id)
);

-- 5. 打赏记录表（占位）
create table public.tips (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade,
  amount numeric not null,
  stripe_session_id text,
  created_at timestamptz not null default now()
);
```

### 3.2 自动触发逻辑（必须生成）
- **新用户注册时自动创建 profile**：创建一个 Supabase `handle_new_user` 函数和触发器，在 `auth.users` 插入后自动向 `public.profiles` 插入一行（id 相同，username 可为空或使用邮箱前缀）。

### 3.3 行级安全策略（RLS）
为每个表启用 RLS 并生成以下策略：
- `profiles`: 任何人都能读取（`true`），但只有 `uid() = id` 的用户可以更新。
- `apps`: 任何人都能读取；只有 `creator_id = uid()` 能更新/删除；插入时自动设置 `creator_id` 为 `uid()`。
- `reviews`: 任何人都能读取；只有登录用户可以插入（`uid() = user_id`），且 `app_id` 和 `user_id` 不能重复；只有作者可删除。
- `remixes`: 任何人都能读取；插入时验证 `child_app_id` 的创建者是 `uid()`。
- Storage `screenshots` bucket：公开读取，但只有登录用户且拥有者可以上传/删除（根据路径包含用户 ID 或直接使用 RLS 策略）。

## 4. 服务端架构与数据获取模式

### 4.1 Supabase 客户端初始化
- 创建一个共享的 `lib/supabase/server.ts` 用于服务端组件：使用 `createServerComponentClient`。
- 创建一个 `lib/supabase/client.ts` 用于客户端组件（需要 `NEXT_PUBLIC_*` 变量）。
- 服务端 actions（表单提交）使用 `createRouteHandlerClient` 或上述服务端客户端。

### 4.2 数据获取原则
- **Server Components** 直接查询 Supabase 获取数据，并将数据作为 props 传给客户端组件。
- 避免在客户端组件中直接调用 Supabase 查询，除非是实时交互（如提交评论后的刷新）。使用 Server Actions 或 React Query 手动刷新。
- 列表页支持分页：使用 Supabase 的 `range()` 和 `order`，每页 12 个应用。
- 排序选项：`created_at` (最新)、评分降序（需计算平均评分，见下文）、`remix_count`。

### 4.3 平均评分计算
在 `apps` 表上不要存储冗余评分（避免同步问题），而是在查询应用列表或详情时，通过 Supabase 的 `reviews` 表聚合计算：
- 使用 `.select('*, reviews(rating)')` 然后在服务端计算，或者直接使用原始 SQL 在视图或函数中计算。请生成一个**数据库函数** `get_app_avg_rating(app_id uuid) returns numeric`，并在服务端调用。

### 4.4 Remix 链查询
- 详情页需展示父应用和子应用链。实现一个服务端函数，递归查询或使用单独的联接：查询 `remixes` 表获取 `parent_app_id` 和 `child_app_id`，再通过应用 ID 查询应用名称和 id。最多展示 5 代。

## 5. 关键业务逻辑实现

### 5.1 用户认证完整流程
- 使用 Supabase Auth 的 `@supabase/ssr` 包设置 cookie 会话。
- 登录页 `/login` 和注册页 `/register`，包含邮箱/密码和 Google OAuth。
- 登录成功后重定向回之前访问的页面或首页。
- 在中间件 `middleware.ts` 中检查 session，保护 `/create`、`/profile`、`/settings` 等需要登录的路由，未登录则重定向到 `/login?redirect=...`。

### 5.2 应用发布流程
- **创建应用 (`/create`)**: 使用 React Hook Form + Zod 进行前端验证。表单字段：name, slogan, description (Markdown 字符串), category (下拉), tech_stack (多选), license, screenshots (文件上传), demo_url, prompt_text, remix_allowed (toggle), remix_license。
- **图片上传**：客户端使用 `supabase.storage.from('screenshots').upload()` 上传到 `public/` 路径，返回公开 URL 并存入 `screenshots` 数组。需处理上传 loading 状态和错误。上传前要限制文件大小（最大 5MB）和类型（png,jpg,webp,gif）。
- 提交后调用 Server Action `createApp`，在此函数内验证用户身份，将应用数据插入 `apps` 表，同时如果存在 `remix_from` 查询参数，则插入 `remixes` 表记录（child_app_id = 新应用ID，parent_app_id = 来源应用ID）。
- 成功后重定向到 `/apps/[newId]`。

### 5.3 评论与评分交互
- 详情页显示评论列表（带分页）。
- 用户登录后可以提交评论和 1-5 星评分。
- 提交通过 Server Action `submitReview`，检查是否已存在评论（`unique` 约束处理）。如果存在则返回错误提示。
- 提交后，页面应重新验证数据（使用 `revalidatePath`）以显示新评论和更新平均评分。

### 5.4 Remix 操作流程
- 在应用详情页，点击“Remix”按钮打开对话框。
- 对话框显示原应用的 `prompt_text`（如果公开）和完整描述，并提供“复制提示词”按钮（调用 `navigator.clipboard.writeText`，成功后有对勾动画）。
- 对话框底部有一个“我已完成 Remix，发布”链接，跳转到 `/create?remix_from={id}`。
- 新应用创建时自动建立 Remix 关联。

### 5.5 打赏/购买（占位）
- 详情页显示“打赏”按钮，弹出金额选择对话框，点击后调用 Server Action `createTip`，创建一个 `tips` 记录（金额固定，stripe_session_id 留空），并提示“功能即将上线”。这是为了后续集成 Stripe 保留数据通道。

## 6. 前端页面与组件详细要求（结合视觉）

在保持之前提到的“深色玻璃拟态 + 霓虹微光”风格基础上，每个页面必须严格实现以下交互逻辑：

### 6.1 首页
- 获取应用列表：默认按最新排序，支持切换排序和分类过滤（通过查询参数）。
- 使用 Server Component 获取数据，过滤和排序在服务端完成（Supabase 查询）。
- 卡片点击跳转到详情页。
- “本周最火”榜单通过查询 `reviews` 表中最近一周创建的应用，按平均评分降序取前 10。
- Hero 区域带有 framer-motion 动画。

### 6.2 详情页
- 首先通过 `id` 获取应用详情，同时获取创造者信息（`profiles` 联结）。
- 平均评分和评论总数单独获取。
- 评论列表：通过 Server Component 获取，支持分页。
- “Remix 链”组件：从服务端获取父子应用列表，前端渲染为时间轴。
- 编辑和删除按钮：仅应用创建者可见。删除操作弹出确认对话框，调用 Server Action `deleteApp`，成功后重定向到首页。

### 6.3 用户资料页
- 展示用户信息和他发布的应用列表（可分页）。
- 如果当前查看的是自己的资料，显示“编辑资料”按钮，点击后在页面内编辑（或跳转到独立编辑页）。

### 6.4 通用组件
- **Navbar**: 登录后显示用户头像下拉菜单（退出登录、我的资料、创建应用）。
- **搜索功能**：在导航栏有搜索图标，点击后展开输入框，搜索通过 URL 参数 `q` 传递到首页（`/?q=xxx`），首页在服务端使用 `ilike` 查询 `name` 和 `description` 字段。
- **空状态**: 无应用、无评论等情况显示友好的插图和文案。
- **错误处理**: 使用 Next.js `error.tsx` 文件处理路由错误；表单使用 toast 提示错误消息。

## 7. 安全与性能要求
- 所有 Server Action 必须验证用户身份（通过 `createRouteHandlerClient` 获取 `session`）。
- 输入验证：服务端使用 Zod 再次校验表单数据。
- 防止 SQL 注入：使用 Supabase 的参数化查询（默认支持）。
- 图片上传：必须检查文件类型和大小，限制上传频率。
- 使用 Next.js `revalidatePath` 实现数据新鲜度，避免不必要的缓存过期。

## 8. 辅助工具生成要求
（保留之前的 Skills、MCP、测试、Agent 要求，此处可简要列出或整合）

## 9. 交付物
请生成所有必需的文件，包括：
- 完整的 Next.js 项目结构
- Supabase 迁移 SQL 文件
- 环境变量示例文件
- README 详细说明如何设置 Supabase、运行项目、激活工具
- 不要省略任何关键逻辑，确保项目可以直接 `npm run dev` 后正常运作。