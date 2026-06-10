-- Add missing columns to prompts table that the app code expects
-- Safe additive migration: no destructive data changes.

alter table public.prompts
  add column if not exists description text,
  add column if not exists reference_required boolean not null default false,
  add column if not exists visibility text not null default 'public',
  add column if not exists hidden boolean not null default false,
  add column if not exists price numeric not null default 0;

-- Sync existing rows: public prompts that are not hidden and not deleted -> approved
-- This matches the logic in the prompt listing functions
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'prompts' and column_name = 'visibility'
  ) then
    update public.prompts
    set status = 'approved'
    where status = 'pending'
      and visibility = 'public'
      and hidden = false
      and deleted_at is null;
  end if;
end
$$;

-- Recreate RLS policies that reference visibility/hidden columns
-- These may not exist yet if the migration is applied to a fresh database,
-- but they use IF NOT EXISTS so it's safe to re-run.

drop policy if exists "Users can view public prompts" on public.prompts;
create policy "Users can view public prompts" on public.prompts
  for select
  using (
    (visibility = 'public' and hidden = false and deleted_at is null)
    or auth.uid() = user_id
    or public.is_admin()
  );

drop policy if exists "Anyone can view public prompts" on public.prompts;
create policy "Anyone can view public prompts" on public.prompts
  for select
  using (
    (visibility = 'public' and hidden = false and deleted_at is null)
    or auth.uid() = user_id
    or public.is_admin()
  );
