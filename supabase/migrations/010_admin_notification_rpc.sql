create or replace function public.admin_create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text default null,
  notification_cta_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_notification_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can create notifications'
      using errcode = '42501';
  end if;

  insert into public.notifications (user_id, type, title, body, cta_href)
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_cta_href
  )
  returning id into new_notification_id;

  return new_notification_id;
end;
$$;

revoke all on function public.admin_create_notification(uuid, text, text, text, text) from public;
grant execute on function public.admin_create_notification(uuid, text, text, text, text) to authenticated;
