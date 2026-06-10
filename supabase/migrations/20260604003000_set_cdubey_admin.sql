update public.profiles
set role = 'admin'::public.profile_role,
    updated_at = now()
where lower(email) = lower('Cdubey159@gmail.com');

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case
      when lower(coalesce(new.email, '')) = lower('Cdubey159@gmail.com') then 'admin'::public.profile_role
      else 'user'::public.profile_role
    end,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        role = case
          when lower(coalesce(excluded.email, '')) = lower('Cdubey159@gmail.com') then 'admin'::public.profile_role
          else public.profiles.role
        end,
        updated_at = now();

  return new;
end;
$$;
