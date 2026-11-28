-- Additive support for one optional work-level opening and optional section subtitles.
-- A prologue uses an opening container in the existing hierarchy so existing
-- chapter IDs, progress, notes, publication and RLS remain intact.
alter table public.volumes add column entry_type text not null default 'volume'
  check (entry_type in ('volume', 'prologue'));
create unique index volumes_one_prologue_per_work on public.volumes(work_id)
  where entry_type = 'prologue';
alter table public.sections add column subtitle text;
alter table public.section_drafts add column subtitle text;
alter table public.revisions add column subtitle text;

create function public.create_story_prologue(target_work uuid, prologue_title text default '楔子')
returns uuid language plpgsql security invoker set search_path = '' as $$
declare opening_id uuid; opening_chapter uuid; opening_section uuid;
begin
  if not story_private.is_admin() then raise exception 'Access denied'; end if;
  if prologue_title is null or length(trim(prologue_title)) = 0 or length(prologue_title) > 200 then
    raise exception 'Invalid prologue title';
  end if;
  -- Serialize creation for this work, and make retries return the existing draft.
  perform 1 from public.works where id = target_work for update;
  if not found then raise exception 'Work not found'; end if;
  select id into opening_id from public.volumes where work_id=target_work and entry_type='prologue';
  if opening_id is null then
    insert into public.volumes(work_id,title,entry_type,sort_order,is_published)
      values(target_work,'楔子','prologue',0,false) returning id into opening_id;
  end if;
  select id into opening_chapter from public.chapters where volume_id=opening_id order by sort_order,created_at limit 1;
  if opening_chapter is null then
    insert into public.chapters(volume_id,title,sort_order,status)
      values(opening_id,prologue_title,0,'draft') returning id into opening_chapter;
  end if;
  select id into opening_section from public.sections where chapter_id=opening_chapter order by sort_order,created_at limit 1;
  if opening_section is null then
    insert into public.sections(chapter_id,title,sort_order,is_published)
      values(opening_chapter,prologue_title,0,false) returning id into opening_section;
  end if;
  return opening_section;
end;
$$;
revoke all on function public.create_story_prologue(uuid,text) from public,anon;
grant execute on function public.create_story_prologue(uuid,text) to authenticated;

-- Preserve the existing signature, invoker security and grants; include subtitles
-- in the same publication transaction and revision snapshot as the body.
create or replace function public.publish_story_section(target_section uuid, new_type text, new_order integer)
returns void language plpgsql security invoker set search_path = '' as $$
declare d public.section_drafts%rowtype;
begin
  if not story_private.is_admin() then raise exception 'Access denied'; end if;
  select * into strict d from public.section_drafts where section_id=target_section;
  insert into public.revisions(section_id,title,subtitle,content)
    select id,title,subtitle,content from public.sections where id=target_section and is_published;
  update public.sections set title=d.title,subtitle=d.subtitle,content=d.content,
    section_type=new_type,sort_order=new_order,word_count=char_length(d.content),
    is_published=true,updated_at=now() where id=target_section;
end;
$$;
notify pgrst, 'reload schema';
