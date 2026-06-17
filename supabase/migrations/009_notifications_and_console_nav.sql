create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null default 'system' check (type in ('creator_application', 'app_review', 'report', 'account', 'system')),
  title text not null,
  body text,
  cta_href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_id_is_read_idx on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "users read own notifications admins read all" on public.notifications;
drop policy if exists "admins create notifications" on public.notifications;
drop policy if exists "users update own notifications" on public.notifications;

create policy "users read own notifications admins read all"
on public.notifications for select
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy "admins create notifications"
on public.notifications for insert
with check (public.is_admin(auth.uid()));

create policy "users update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
