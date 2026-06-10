-- Admin Control Dashboard v1
-- Safe additive migration: no destructive data changes.

alter table public.profiles
  add column if not exists status text not null default 'active',
  add column if not exists banned_at timestamptz,
  add column if not exists banned_by uuid references public.profiles(id) on delete set null,
  add column if not exists ban_reason text;

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check check (status in ('active', 'banned'));

alter table public.prompts
  add column if not exists creator_name text,
  add column if not exists save_count integer not null default 0,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

update public.prompts p
set save_count = coalesce(saves.total, 0)
from (
  select prompt_id, count(*)::integer as total
  from public.saved_prompts
  group by prompt_id
) saves
where p.id = saves.prompt_id;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  target_table text not null,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists cta_text text not null default 'Start exploring prompts',
  add column if not exists empty_state_title text not null default 'No prompts yet',
  add column if not exists empty_state_message text not null default 'Approved prompts will appear here.',
  add column if not exists featured_prompt_ids uuid[] not null default '{}',
  add column if not exists trending_prompt_ids uuid[] not null default '{}';

create index if not exists prompts_status_deleted_idx on public.prompts (status, deleted_at, created_at desc);
create index if not exists prompts_featured_deleted_idx on public.prompts (featured, deleted_at, created_at desc);
create index if not exists prompts_user_status_idx on public.prompts (user_id, status, created_at desc);
create index if not exists profiles_role_status_idx on public.profiles (role, status, created_at desc);
create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists categories_active_sort_idx on public.categories (is_active, sort_order, name);
create index if not exists tags_slug_idx on public.tags (slug);
create index if not exists tags_active_name_idx on public.tags (is_active, name);
create index if not exists admin_logs_created_idx on public.admin_logs (created_at desc);
create index if not exists admin_logs_target_idx on public.admin_logs (target_table, target_id, created_at desc);

insert into public.categories (name, slug)
select distinct initcap(trim(category)), lower(regexp_replace(trim(category), '[^a-zA-Z0-9]+', '-', 'g'))
from public.prompts
where coalesce(trim(category), '') <> ''
on conflict (slug) do nothing;

insert into public.tags (name, slug)
select distinct lower(trim(tag)), lower(regexp_replace(trim(tag), '[^a-zA-Z0-9]+', '-', 'g'))
from public.prompts, unnest(coalesce(tags, '{}')) as tag
where coalesce(trim(tag), '') <> ''
on conflict (slug) do nothing;

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.admin_logs enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Admins can manage categories" on public.categories;
drop policy if exists "Public can read active tags" on public.tags;
drop policy if exists "Admins can manage tags" on public.tags;
drop policy if exists "Admins can read admin logs" on public.admin_logs;
drop policy if exists "Admins can insert admin logs" on public.admin_logs;

create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active tags"
on public.tags
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage tags"
on public.tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read admin logs"
on public.admin_logs
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert admin logs"
on public.admin_logs
for insert
to authenticated
with check (public.is_admin());

create or replace function public.sync_prompt_save_count(prompt_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompts
  set save_count = (
    select count(*)::integer
    from public.saved_prompts
    where saved_prompts.prompt_id = prompt_uuid
  ),
  updated_at = now()
  where prompts.id = prompt_uuid;
end;
$$;

create or replace function public.saved_prompts_sync_count_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_prompt_save_count(old.prompt_id);
    return old;
  end if;

  perform public.sync_prompt_save_count(new.prompt_id);
  return new;
end;
$$;

drop trigger if exists saved_prompts_sync_count_after_insert on public.saved_prompts;
drop trigger if exists saved_prompts_sync_count_after_delete on public.saved_prompts;

create trigger saved_prompts_sync_count_after_insert
after insert on public.saved_prompts
for each row execute function public.saved_prompts_sync_count_trigger();

create trigger saved_prompts_sync_count_after_delete
after delete on public.saved_prompts
for each row execute function public.saved_prompts_sync_count_trigger();

create or replace function public.admin_prompt_counts()
returns table(status text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select prompts.status::text as status, count(*)::bigint as count
  from public.prompts
  where prompts.deleted_at is null
  group by prompts.status;
end;
$$;

grant execute on function public.admin_prompt_counts() to authenticated;
drop function if exists public.admin_list_prompts(text);

create or replace function public.admin_list_prompts(filter_status text default null)
returns table(
  id uuid,
  user_id uuid,
  title text,
  description text,
  prompt_text text,
  negative_prompt text,
  image_url text,
  category text,
  tags text[],
  ai_model text,
  aspect_ratio text,
  reference_required boolean,
  status text,
  rejection_reason text,
  copy_count integer,
  view_count integer,
  save_count integer,
  price numeric,
  featured boolean,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  creator_name_override text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  creator_email text,
  creator_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select
    prompts.id,
    prompts.user_id,
    prompts.title,
    prompts.description,
    prompts.prompt_text,
    prompts.negative_prompt,
    prompts.image_url,
    prompts.category,
    prompts.tags,
    prompts.ai_model,
    prompts.aspect_ratio,
    prompts.reference_required,
    prompts.status::text,
    prompts.rejection_reason,
    prompts.copy_count,
    prompts.view_count,
    prompts.save_count,
    prompts.price,
    prompts.featured,
    prompts.deleted_at,
    prompts.deleted_by,
    prompts.creator_name,
    prompts.created_at,
    prompts.updated_at,
    profiles.email,
    coalesce(prompts.creator_name, profiles.full_name, profiles.display_name)
  from public.prompts
  left join public.profiles on profiles.id = prompts.user_id
  where
    case
      when filter_status = 'featured' then prompts.featured = true and prompts.deleted_at is null
      when filter_status = 'deleted' then prompts.deleted_at is not null
      when filter_status is null or filter_status = 'all' then true
      else prompts.status::text = filter_status and prompts.deleted_at is null
    end
  order by prompts.created_at desc;
end;
$$;

grant execute on function public.admin_list_prompts(text) to authenticated;
grant execute on function public.sync_prompt_save_count(uuid) to authenticated;

select pg_notify('pgrst', 'reload schema');

