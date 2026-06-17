alter table public.apps
add column if not exists contact_info jsonb not null default '{}';
