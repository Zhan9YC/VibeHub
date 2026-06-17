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

update public.profiles
set
  username = regexp_replace(lower(coalesce(nullif(split_part(auth.users.email, '@', 1), ''), 'user')), '[^a-z0-9_-]+', '', 'g')
    || '_' || left(replace(public.profiles.id::text, '-', ''), 8),
  updated_at = now()
from auth.users
where public.profiles.id = auth.users.id
  and public.profiles.username is null;
