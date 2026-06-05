alter table public.profiles
  add column if not exists manual_badge_override boolean not null default false,
  add column if not exists manual_badge_type text not null default 'none',
  add column if not exists manual_badge_assigned_by uuid references public.profiles(id) on delete set null,
  add column if not exists manual_badge_assigned_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_manual_badge_type_check;

alter table public.profiles
  add constraint profiles_manual_badge_type_check
  check (manual_badge_type in ('none', 'bronze', 'silver', 'gold', 'diamond'));

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role = old.role;
    new.manual_badge_override = old.manual_badge_override;
    new.manual_badge_type = old.manual_badge_type;
    new.manual_badge_assigned_by = old.manual_badge_assigned_by;
    new.manual_badge_assigned_at = old.manual_badge_assigned_at;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields_before_update on public.profiles;
create trigger protect_profile_admin_fields_before_update
before update on public.profiles
for each row execute function public.protect_profile_admin_fields();

create table if not exists public.copy_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  copied_at timestamptz not null default now(),
  unique (user_id, prompt_id)
);

create index if not exists copy_history_user_id_idx on public.copy_history (user_id, copied_at desc);
create index if not exists copy_history_prompt_id_idx on public.copy_history (prompt_id, copied_at desc);

alter table public.copy_history enable row level security;

drop policy if exists "Users can read own copy history" on public.copy_history;
drop policy if exists "Users can create own copy history" on public.copy_history;
drop policy if exists "Admins can manage copy history" on public.copy_history;

create policy "Users can read own copy history"
on public.copy_history
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own copy history"
on public.copy_history
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Admins can manage copy history"
on public.copy_history
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.record_prompt_copy(prompt_uuid uuid)
returns table(copy_count integer, counted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer := 0;
  inserted_count integer := 0;
begin
  select coalesce(prompts.copy_count, 0)
    into current_count
  from public.prompts
  where prompts.id = prompt_uuid
    and prompts.status = 'approved'::public.prompt_status;

  if not found then
    return query select 0::integer, false;
    return;
  end if;

  if auth.uid() is null then
    return query select current_count, false;
    return;
  end if;

  insert into public.copy_history (user_id, prompt_id)
  values (auth.uid(), prompt_uuid)
  on conflict (user_id, prompt_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.prompts
      set copy_count = coalesce(public.prompts.copy_count, 0) + 1,
          updated_at = now()
    where public.prompts.id = prompt_uuid
    returning public.prompts.copy_count into current_count;
  end if;

  return query select current_count, inserted_count > 0;
end;
$$;

grant execute on function public.record_prompt_copy(uuid) to anon, authenticated;

drop function if exists public.increment_prompt_copy_count(uuid);
create function public.increment_prompt_copy_count(prompt_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer := 0;
  was_counted boolean := false;
begin
  select result.copy_count, result.counted
    into next_count, was_counted
  from public.record_prompt_copy(prompt_uuid) as result
  limit 1;

  return coalesce(next_count, 0);
end;
$$;

grant execute on function public.increment_prompt_copy_count(uuid) to anon, authenticated;

create table if not exists public.creator_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, creator_id),
  check (user_id <> creator_id)
);

create index if not exists creator_follows_user_id_idx on public.creator_follows (user_id, created_at desc);
create index if not exists creator_follows_creator_id_idx on public.creator_follows (creator_id, created_at desc);

alter table public.creator_follows enable row level security;

drop policy if exists "Users can read own creator follows" on public.creator_follows;
drop policy if exists "Users can follow creators" on public.creator_follows;
drop policy if exists "Users can unfollow creators" on public.creator_follows;
drop policy if exists "Admins can manage creator follows" on public.creator_follows;

create policy "Users can read own creator follows"
on public.creator_follows
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "Users can follow creators"
on public.creator_follows
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can unfollow creators"
on public.creator_follows
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can manage creator follows"
on public.creator_follows
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  prompt_id uuid references public.prompts(id) on delete set null,
  event_type text not null,
  subject text not null,
  status text not null default 'skipped',
  provider text not null default 'resend',
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check (status in ('sent', 'failed', 'skipped'))
);

create index if not exists email_events_event_type_idx on public.email_events (event_type, created_at desc);
create index if not exists email_events_recipient_user_idx on public.email_events (recipient_user_id, created_at desc);
create index if not exists email_events_prompt_id_idx on public.email_events (prompt_id, created_at desc);

alter table public.email_events enable row level security;

drop policy if exists "Admins can manage email events" on public.email_events;

create policy "Admins can manage email events"
on public.email_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop function if exists public.admin_list_prompts(text);

alter table public.prompts
  drop constraint if exists prompts_difficulty_check;

alter table public.prompts
  drop column if exists difficulty;

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
  price numeric,
  featured boolean,
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
    prompts.price,
    prompts.featured,
    prompts.created_at,
    prompts.updated_at,
    profiles.email,
    coalesce(profiles.full_name, profiles.display_name)
  from public.prompts
  left join public.profiles on profiles.id = prompts.user_id
  where filter_status is null
    or filter_status = 'all'
    or prompts.status::text = filter_status
  order by prompts.created_at desc;
end;
$$;

grant execute on function public.admin_list_prompts(text) to authenticated;

select pg_notify('pgrst', 'reload schema');
