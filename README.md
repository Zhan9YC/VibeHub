# VibeHub

VibeHub 是一个面向 Vibecoding 的应用市场与 Remix 社区。项目使用 Next.js 14 App Router、TypeScript、Tailwind CSS、Supabase Auth/Postgres/Storage，并为后续 Stripe Connect 打赏集成预留了数据通道。

## 功能范围

- 应用浏览、搜索、分类过滤、分页和排序
- 本周热门榜单
- Supabase 邮箱密码登录、注册、Google OAuth
- 普通用户、创作者、管理员三类角色
- 创作者申请、管理员审批、应用发布审核、举报复核
- 免费获取应用、个人应用库、获取后评论的闭环
- 受保护的 `/create`、`/settings`、`/profile`、`/admin/*` 路由
- 应用发布表单，含 Zod/React Hook Form 验证、社区准则确认、违规词过滤、截图上传、技术栈多选、Remix 授权
- 应用详情页，含作者信息、评分统计、评论、Remix 对话框、Remix 链、删除确认
- 用户资料页和资料编辑
- 打赏占位流程，记录 `tips` 数据，暂不跳转 Stripe
- Supabase RLS、自动 profile 创建、平均评分函数、Storage bucket 策略

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 创建 `.env.local`：

```bash
cp .env.example .env.local
```

填入 Supabase 项目的公开配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. 在 Supabase SQL Editor 按顺序执行迁移：

```bash
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fix_auth_profile_trigger.sql
supabase/migrations/003_signup_otp_username_defaults.sql
supabase/migrations/004_favorites_dashboard.sql
supabase/migrations/005_app_contact_info.sql
supabase/migrations/006_role_and_review.sql
supabase/migrations/007_profile_repair_and_application_feedback.sql
supabase/migrations/008_free_acquisition_and_library.sql
supabase/migrations/009_notifications_and_console_nav.sql
```

如果登录或注册成功后页面出现 `PGRST205: Could not find the table 'public.apps' in the schema cache`，说明当前 Supabase 项目还没有执行上面的表结构迁移。

注册页使用邮箱验证码完成二次确认。请在 Supabase Auth 的邮件模板里保留验证码 token，或使用默认可验证邮件模板。`profiles` 记录会在邮箱确认后创建；未确认邮箱的待验证 `auth.users` 不会提前出现在 `profiles` 表。

### 从旧版本升级到角色审核版本

1. 先确认已执行 `001` 到 `005` 迁移，再执行 `006_role_and_review.sql`、`007_profile_repair_and_application_feedback.sql`、`008_free_acquisition_and_library.sql` 和 `009_notifications_and_console_nav.sql`。
2. `006` 会为 `profiles` 增加 `role`、`is_banned`，为 `apps` 增加 `status`，并创建 `creator_applications`、`reports`。
3. `007` 会为创作者申请补充 `review_note`、`reviewed_at`，并允许用户在触发器漏写时自动补建自己的 `profiles` 记录，修复“用户资料不存在”导致的申请失败。
4. 已存在的应用会在首次执行 `006` 时设为 `published`，避免升级后首页突然空白；后续新发布应用默认进入 `pending_review`。
5. 首个在迁移后完成 profile 创建的新用户会自动成为 `admin`。如果你已有用户，请在 Supabase SQL Editor 手动指定管理员：

```sql
update public.profiles
set role = 'admin'
where id = '你的用户 uuid';
```

6. 管理员入口：

```text
/admin/apps          应用审核和被举报应用复核
/admin/applications  创作者申请审批
/admin/reports       举报处理
```

7. 普通用户不能直接发布应用，需要在 `/apply-creator` 提交申请；管理员批准后该用户角色变为 `creator`。
8. 创作者申请现在形成闭环：用户能在申请页和资料页看到当前状态、处理时间和审核说明；管理员拒绝申请时必须填写原因。
9. 创作者提交或修改应用后，应用状态会重置为 `pending_review`，只有管理员审核通过后才会公开展示。
10. 用户举报公开应用后，数据库触发器会自动把应用状态设为 `flagged`，管理员可确认违规下架或驳回举报恢复公开。
11. `008` 会新增 `app_claims`，把“免费获取应用”做成类似电商零元下单的闭环。用户先获取，再进入“我的应用库”，并且只有已获取用户才能提交评论。
12. `009` 会新增 `notifications` 站内通知表。创作者申请结果、应用审核结果、举报处理结果、封禁/解封处理都会出现在 `/notifications`。

4. 在 Supabase Auth 设置里启用邮箱密码登录。若使用 Google OAuth，还需要在 Supabase Auth Providers 中配置 Google，并把回调地址加入允许列表：

```text
http://localhost:3000/auth/callback
```

5. 启动开发服务器：

```bash
npm run dev
```

访问 `http://localhost:3000`。

## 数据库说明

迁移文件会创建：

- `profiles`
- `apps`
- `reviews`
- `remixes`
- `tips`
- `creator_applications`
- `reports`
- `app_claims`
- `notifications`
- `screenshots` public bucket
- `handle_new_user()` 注册触发器
- `get_app_avg_rating(app_id uuid)` 平均评分函数
- 所有核心表的 RLS 策略

截图上传路径格式是 `{user_id}/{uuid}.{ext}`，Storage RLS 会用路径第一段校验上传和删除权限。

## 项目结构

```text
app/                    Next.js App Router 页面与路由
components/             UI、表单、对话框和业务组件
lib/actions.ts          Server Actions
lib/data.ts             Server Component 数据读取函数
lib/schemas.ts          Zod 输入验证
lib/supabase/           Supabase 浏览器端、服务端和中间件客户端
supabase/migrations/    数据库迁移 SQL
```

## 注意事项

- Server Actions 会重新验证用户身份，不能只依赖前端状态。
- `/create` 仅 `creator` 和 `admin` 可访问；`/admin/*` 仅 `admin` 可访问。
- 列表页默认使用 Supabase 查询分页；评分和 Remix 排序会拉取最近一批数据后在服务端排序，适合 MVP。数据量扩大后建议改成数据库视图或 RPC。
- 编辑应用入口已预留，当前主要交付创建、删除和资料编辑流程。
