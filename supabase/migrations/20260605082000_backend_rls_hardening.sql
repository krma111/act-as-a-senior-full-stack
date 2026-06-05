create or replace function public.ensure_creator_profile()
returns public.profile_role
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role public.profile_role;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  select
    auth_users.id,
    auth_users.email,
    coalesce(auth_users.raw_user_meta_data->>'full_name', auth_users.raw_user_meta_data->>'display_name'),
    coalesce(auth_users.raw_user_meta_data->>'display_name', auth_users.raw_user_meta_data->>'full_name', split_part(coalesce(auth_users.email, ''), '@', 1)),
    auth_users.raw_user_meta_data->>'avatar_url',
    case
      when lower(coalesce(auth_users.email, '')) = lower('cdubey159@gmail.com') then 'admin'::public.profile_role
      else 'user'::public.profile_role
    end,
    now(),
    now()
  from auth.users auth_users
  where auth_users.id = auth.uid()
  on conflict (id) do nothing;

  update public.profiles
  set role = 'creator'::public.profile_role,
      updated_at = now()
  where id = auth.uid()
    and role = 'user'::public.profile_role;

  select role into current_role
  from public.profiles
  where id = auth.uid();

  if current_role is null then
    raise exception 'Creator profile could not be prepared.' using errcode = '42501';
  end if;

  return current_role;
end;
$$;

grant execute on function public.ensure_creator_profile() to authenticated;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case
      when lower(coalesce(new.email, '')) = lower('cdubey159@gmail.com') then 'admin'::public.profile_role
      else 'user'::public.profile_role
    end,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        role = case
          when lower(coalesce(excluded.email, '')) = lower('cdubey159@gmail.com') then 'admin'::public.profile_role
          else public.profiles.role
        end,
        updated_at = now();

  return new;
end;
$$;

drop policy if exists "Authenticated users can create own prompts" on public.prompts;
drop policy if exists "Authenticated users can update own prompts" on public.prompts;
drop policy if exists "Authenticated users can delete own prompts" on public.prompts;
drop policy if exists "Creators can create prompts" on public.prompts;
drop policy if exists "Creators can update own prompts" on public.prompts;
drop policy if exists "Creators can delete own prompts" on public.prompts;

create policy "Creators can create prompts"
on public.prompts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_creator_or_admin()
  and status = 'pending'::public.prompt_status
);

create policy "Creators can update own prompts"
on public.prompts
for update
to authenticated
using (
  auth.uid() = user_id
  and public.is_creator_or_admin()
)
with check (
  auth.uid() = user_id
  and public.is_creator_or_admin()
  and status = 'pending'::public.prompt_status
);

create policy "Creators can delete own prompts"
on public.prompts
for delete
to authenticated
using (
  auth.uid() = user_id
  and public.is_creator_or_admin()
);

drop policy if exists "Creators create prompt packs" on public.prompt_packs;
drop policy if exists "Creators read own prompt packs" on public.prompt_packs;
drop policy if exists "Creators update own pending prompt packs" on public.prompt_packs;
drop policy if exists "Creators delete own pending prompt packs" on public.prompt_packs;
drop policy if exists "Creators can create own packs" on public.prompt_packs;
drop policy if exists "Creators can read own packs" on public.prompt_packs;
drop policy if exists "Creators can update own pending packs" on public.prompt_packs;
drop policy if exists "Creators can delete own pending packs" on public.prompt_packs;

create policy "Creators create prompt packs"
on public.prompt_packs
for insert
to authenticated
with check (
  auth.uid() = creator_id
  and public.is_creator_or_admin()
  and status = 'pending'
);

create policy "Creators read own prompt packs"
on public.prompt_packs
for select
to authenticated
using (
  auth.uid() = creator_id
  and public.is_creator_or_admin()
);

create policy "Creators update own pending prompt packs"
on public.prompt_packs
for update
to authenticated
using (
  auth.uid() = creator_id
  and public.is_creator_or_admin()
  and status <> 'approved'
)
with check (
  auth.uid() = creator_id
  and public.is_creator_or_admin()
  and status = 'pending'
);

create policy "Creators delete own pending prompt packs"
on public.prompt_packs
for delete
to authenticated
using (
  auth.uid() = creator_id
  and public.is_creator_or_admin()
  and status <> 'approved'
);

select pg_notify('pgrst', 'reload schema');
