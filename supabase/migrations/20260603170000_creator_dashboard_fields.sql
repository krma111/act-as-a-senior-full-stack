alter table public.prompts
  add column if not exists description text,
  add column if not exists reference_required boolean not null default false,
  add column if not exists difficulty text not null default 'intermediate';

alter table public.prompts
  drop constraint if exists prompts_difficulty_check;

alter table public.prompts
  add constraint prompts_difficulty_check
  check (difficulty in ('beginner', 'intermediate', 'advanced'));

create index if not exists prompts_user_status_created_idx
on public.prompts (user_id, status, created_at desc);
