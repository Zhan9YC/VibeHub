create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
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

create table if not exists public.apps (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null default auth.uid(),
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
  contact_info jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(app_id, user_id)
);

create table if not exists public.remixes (
  id uuid default gen_random_uuid() primary key,
  parent_app_id uuid references public.apps(id) on delete cascade not null,
  child_app_id uuid references public.apps(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(parent_app_id, child_app_id),
  check (parent_app_id <> child_app_id)
);

create table if not exists public.tips (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade,
  amount numeric not null check (amount > 0),
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists apps_creator_id_idx on public.apps(creator_id);
create index if not exists apps_category_created_at_idx on public.apps(category, created_at desc);
create index if not exists reviews_app_id_created_at_idx on public.reviews(app_id, created_at desc);
create index if not exists remixes_parent_app_id_idx on public.remixes(parent_app_id);
create index if not exists remixes_child_app_id_idx on public.remixes(child_app_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists apps_set_updated_at on public.apps;
create trigger apps_set_updated_at
before update on public.apps
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    regexp_replace(lower(coalesce(nullif(split_part(new.email, '@', 1), ''), 'user')), '[^a-z0-9_-]+', '', 'g')
      || '_' || left(replace(new.id::text, '-', ''), 8),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
when (new.email_confirmed_at is not null)
execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.handle_new_user();

create or replace function public.get_app_avg_rating(app_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(round(avg(rating)::numeric, 2), 0)
  from public.reviews
  where reviews.app_id = get_app_avg_rating.app_id;
$$;

alter table public.profiles enable row level security;
alter table public.apps enable row level security;
alter table public.reviews enable row level security;
alter table public.remixes enable row level security;
alter table public.tips enable row level security;

create policy "profiles are readable by everyone"
on public.profiles for select
using (true);

create policy "users update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "apps are readable by everyone"
on public.apps for select
using (true);

create policy "authenticated users create own apps"
on public.apps for insert
with check (auth.uid() = creator_id);

create policy "creators update own apps"
on public.apps for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "creators delete own apps"
on public.apps for delete
using (auth.uid() = creator_id);

create policy "reviews are readable by everyone"
on public.reviews for select
using (true);

create policy "authenticated users create own reviews"
on public.reviews for insert
with check (auth.uid() = user_id);

create policy "authors delete own reviews"
on public.reviews for delete
using (auth.uid() = user_id);

create policy "remixes are readable by everyone"
on public.remixes for select
using (true);

create policy "child creator creates remix links"
on public.remixes for insert
with check (
  exists (
    select 1
    from public.apps
    where apps.id = child_app_id
      and apps.creator_id = auth.uid()
  )
);

create policy "tips are readable by app creator"
on public.tips for select
using (
  exists (
    select 1
    from public.apps
    where apps.id = tips.app_id
      and apps.creator_id = auth.uid()
  )
  or auth.uid() = from_user_id
);

create policy "authenticated users create tips"
on public.tips for insert
with check (auth.uid() = from_user_id);

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do update set public = true;

create policy "screenshots are publicly readable"
on storage.objects for select
using (bucket_id = 'screenshots');

create policy "users upload own screenshots"
on storage.objects for insert
with check (
  bucket_id = 'screenshots'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own screenshots"
on storage.objects for update
using (
  bucket_id = 'screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own screenshots"
on storage.objects for delete
using (
  bucket_id = 'screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);
