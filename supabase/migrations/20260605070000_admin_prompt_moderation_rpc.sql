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
  group by prompts.status;
end;
$$;

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
  difficulty text,
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
    prompts.difficulty,
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

grant execute on function public.admin_prompt_counts() to authenticated;
grant execute on function public.admin_list_prompts(text) to authenticated;
