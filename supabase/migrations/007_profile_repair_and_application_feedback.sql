do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_applications' and column_name = 'review_note'
  ) then
    alter table public.creator_applications
      add column review_note text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_applications' and column_name = 'reviewed_at'
  ) then
    alter table public.creator_applications
      add column reviewed_at timestamptz;
  end if;
end $$;

update public.creator_applications
set reviewed_at = coalesce(reviewed_at, updated_at)
where status in ('approved', 'rejected');

drop policy if exists "users create own profile" on public.profiles;

create policy "users create own profile"
on public.profiles for insert
with check (
  auth.uid() = id
  and role = 'user'
  and is_banned = false
);
