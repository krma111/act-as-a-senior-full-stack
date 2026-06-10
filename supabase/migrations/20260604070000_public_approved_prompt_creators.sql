-- Allow public pages to show real creator identity only for creators with approved prompts.
drop policy if exists "Public can read approved prompt creators" on public.profiles;

create policy "Public can read approved prompt creators"
on public.profiles
for select
using (
  exists (
    select 1
    from public.prompts
    where prompts.user_id = profiles.id
      and prompts.status = 'approved'
  )
);
