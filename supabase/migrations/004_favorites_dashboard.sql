create table if not exists public.app_favorites (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(app_id, user_id)
);

create index if not exists app_favorites_app_id_idx on public.app_favorites(app_id);
create index if not exists app_favorites_user_id_created_at_idx on public.app_favorites(user_id, created_at desc);

alter table public.app_favorites enable row level security;

create policy "favorites are readable by everyone"
on public.app_favorites for select
using (true);

create policy "users create own favorites"
on public.app_favorites for insert
with check (auth.uid() = user_id);

create policy "users delete own favorites"
on public.app_favorites for delete
using (auth.uid() = user_id);
