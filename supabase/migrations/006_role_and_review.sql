do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles
      add column role text not null default 'user' check (role in ('user', 'creator', 'admin'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_banned'
  ) then
    alter table public.profiles
      add column is_banned boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'apps' and column_name = 'status'
  ) then
    alter table public.apps
      add column status text not null default 'pending_review' check (status in ('pending_review', 'published', 'rejected', 'flagged'));

    update public.apps set status = 'published';
  end if;
end $$;

create table if not exists public.creator_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists creator_applications_user_id_created_at_idx on public.creator_applications(user_id, created_at desc);
create index if not exists creator_applications_status_created_at_idx on public.creator_applications(status, created_at desc);
create index if not exists reports_status_created_at_idx on public.reports(status, created_at desc);
create index if not exists reports_app_id_idx on public.reports(app_id);
create index if not exists apps_status_created_at_idx on public.apps(status, created_at desc);

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role = 'admin' and is_banned = false
  );
$$;

create or replace function public.is_creator_or_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role in ('creator', 'admin') and is_banned = false
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  next_role text;
begin
  select case when not exists (select 1 from public.profiles) then 'admin' else 'user' end into next_role;

  insert into public.profiles (id, username, role, full_name, avatar_url)
  values (
    new.id,
    regexp_replace(lower(coalesce(nullif(split_part(new.email, '@', 1), ''), 'user')), '[^a-z0-9_-]+', '', 'g')
      || '_' || left(replace(new.id::text, '-', ''), 8),
    next_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.force_app_review_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.creator_id = auth.uid();
    new.status = 'pending_review';
  elsif tg_op = 'UPDATE' then
    if not public.is_admin(auth.uid()) and (
      new.name is distinct from old.name or
      new.slogan is distinct from old.slogan or
      new.description is distinct from old.description or
      new.category is distinct from old.category or
      new.tech_stack is distinct from old.tech_stack or
      new.license is distinct from old.license or
      new.screenshots is distinct from old.screenshots or
      new.demo_url is distinct from old.demo_url or
      new.prompt_text is distinct from old.prompt_text or
      new.remix_allowed is distinct from old.remix_allowed or
      new.remix_license is distinct from old.remix_license or
      new.contact_info is distinct from old.contact_info
    ) then
      new.status = 'pending_review';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists apps_force_review_status on public.apps;
create trigger apps_force_review_status
before insert or update on public.apps
for each row execute function public.force_app_review_status();

create or replace function public.flag_reported_app()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.apps
  set status = 'flagged'
  where id = new.app_id and status = 'published';
  return new;
end;
$$;

drop trigger if exists reports_flag_app on public.reports;
create trigger reports_flag_app
after insert on public.reports
for each row execute function public.flag_reported_app();

drop trigger if exists creator_applications_set_updated_at on public.creator_applications;
create trigger creator_applications_set_updated_at
before update on public.creator_applications
for each row execute function public.set_updated_at();

alter table public.creator_applications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "apps are readable by everyone" on public.apps;
drop policy if exists "authenticated users create own apps" on public.apps;
drop policy if exists "creators update own apps" on public.apps;
drop policy if exists "creators delete own apps" on public.apps;
drop policy if exists "apps visible by status and ownership" on public.apps;
drop policy if exists "creators create pending apps" on public.apps;
drop policy if exists "creators update own apps admins update all" on public.apps;
drop policy if exists "creators delete own apps admins delete all" on public.apps;

create policy "apps visible by status and ownership"
on public.apps for select
using (
  status = 'published'
  or creator_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy "creators create pending apps"
on public.apps for insert
with check (
  creator_id = auth.uid()
  and status = 'pending_review'
  and public.is_creator_or_admin(auth.uid())
);

create policy "creators update own apps admins update all"
on public.apps for update
using (
  public.is_admin(auth.uid())
  or (creator_id = auth.uid() and public.is_creator_or_admin(auth.uid()))
)
with check (
  public.is_admin(auth.uid())
  or (creator_id = auth.uid() and public.is_creator_or_admin(auth.uid()))
);

create policy "creators delete own apps admins delete all"
on public.apps for delete
using (
  public.is_admin(auth.uid())
  or (creator_id = auth.uid() and public.is_creator_or_admin(auth.uid()))
);

drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
on public.profiles for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "applications visible to owner and admin" on public.creator_applications;
drop policy if exists "users create own applications" on public.creator_applications;
drop policy if exists "admins update applications" on public.creator_applications;

create policy "applications visible to owner and admin"
on public.creator_applications for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users create own applications"
on public.creator_applications for insert
with check (user_id = auth.uid());

create policy "admins update applications"
on public.creator_applications for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "reports visible to reporter and admin" on public.reports;
drop policy if exists "users create own reports" on public.reports;
drop policy if exists "admins update reports" on public.reports;

create policy "reports visible to reporter and admin"
on public.reports for select
using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users create own reports"
on public.reports for insert
with check (reporter_id = auth.uid());

create policy "admins update reports"
on public.reports for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
