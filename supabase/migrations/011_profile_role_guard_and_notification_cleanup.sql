create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if auth.uid() = old.id then
    new.role = old.role;
    new.is_banned = old.is_banned;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_fields on public.profiles;
create trigger profiles_protect_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

update public.notifications
set
  title = '应用《' || public.apps.name || '》已通过审核',
  body = '你的应用已通过审核，现已在市场公开展示。'
from public.apps
where public.notifications.type = 'app_review'
  and public.notifications.body = 'Your app has been approved and is now visible in the marketplace.'
  and public.notifications.cta_href = '/apps/' || public.apps.id::text;

update public.notifications
set
  title = '应用《' || public.apps.name || '》未通过审核',
  body = '请修改应用后重新提交审核。'
from public.apps
where public.notifications.type = 'app_review'
  and public.notifications.body = 'Please update your app and submit it for review again.'
  and public.notifications.cta_href = '/apps/' || public.apps.id::text;
