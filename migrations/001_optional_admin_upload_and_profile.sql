-- Applied on 2026-11-28 after explicit user approval. Do not reapply.
-- Preserves existing tables, data, policies and private bucket visibility.
begin;

-- Only an active admin may upload NEW cover objects. No overwrite/delete policy.
create policy story_art_admin_insert_covers
on storage.objects for insert to authenticated
with check (
  bucket_id = 'story-art'
  and (storage.foldername(name))[1] = 'covers'
  and story_private.is_admin()
);

-- A reader cannot UPDATE profiles under the current RLS. Expose only this
-- narrow operation instead of allowing arbitrary profile/role updates.
create function public.update_story_display_name(new_name text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not story_private.is_active_user() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if new_name is null or length(trim(new_name)) < 1 or length(trim(new_name)) > 80 then
    raise exception 'Display name must contain 1 to 80 characters';
  end if;
  update public.profiles set display_name = trim(new_name) where id = auth.uid();
end;
$$;
revoke all on function public.update_story_display_name(text) from public, anon;
grant execute on function public.update_story_display_name(text) to authenticated;
commit;
