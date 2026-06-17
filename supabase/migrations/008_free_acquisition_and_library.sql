create table if not exists public.app_claims (
  id uuid default gen_random_uuid() primary key,
  app_id uuid references public.apps(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'claimed' check (status in ('claimed')),
  created_at timestamptz not null default now(),
  last_opened_at timestamptz,
  unique(app_id, user_id)
);

create index if not exists app_claims_user_id_created_at_idx on public.app_claims(user_id, created_at desc);
create index if not exists app_claims_app_id_created_at_idx on public.app_claims(app_id, created_at desc);

alter table public.app_claims enable row level security;

drop policy if exists "users read own claims creators read app claims admins read all" on public.app_claims;
drop policy if exists "users claim published apps" on public.app_claims;
drop policy if exists "users update own claims" on public.app_claims;

create policy "users read own claims creators read app claims admins read all"
on public.app_claims for select
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or exists (
    select 1
    from public.apps
    where apps.id = app_claims.app_id
      and apps.creator_id = auth.uid()
  )
);

create policy "users claim published apps"
on public.app_claims for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.apps
    join public.profiles on profiles.id = auth.uid()
    where apps.id = app_claims.app_id
      and apps.status = 'published'
      and profiles.is_banned = false
  )
);

create policy "users update own claims"
on public.app_claims for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "authenticated users create own reviews" on public.reviews;
drop policy if exists "claimed users create reviews" on public.reviews;

create policy "claimed users create reviews"
on public.reviews for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.app_claims
    where app_claims.app_id = reviews.app_id
      and app_claims.user_id = auth.uid()
  )
  and not exists (
    select 1
    from public.apps
    where apps.id = reviews.app_id
      and apps.creator_id = auth.uid()
  )
);
