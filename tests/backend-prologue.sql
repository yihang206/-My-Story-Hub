-- Synthetic accounts/content; all changes are rolled back at the end.
begin;
set local statement_timeout = '15s';
insert into auth.users(id,email,aud,role) values
('b1000000-0000-4000-8000-000000000001','prologue-admin@example.invalid','authenticated','authenticated'),
('b1000000-0000-4000-8000-000000000002','prologue-reader@example.invalid','authenticated','authenticated');
insert into public.profiles(id,display_name,role,is_active) values
('b1000000-0000-4000-8000-000000000001','Synthetic admin','admin',true),
('b1000000-0000-4000-8000-000000000002','Synthetic reader','reader',true);
insert into public.works(id,title,is_published) values('b2000000-0000-4000-8000-000000000001','Synthetic prologue work',true);
insert into public.volumes(work_id,title,sort_order) values('b2000000-0000-4000-8000-000000000001','Synthetic first volume',0);
insert into public.work_access(user_id,work_id,is_active) values('b1000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ declare sid uuid; again uuid;
begin
  sid := public.create_story_prologue('b2000000-0000-4000-8000-000000000001','楔子　合成测试');
  again := public.create_story_prologue('b2000000-0000-4000-8000-000000000001','重试不得改名');
  if sid<>again then raise exception 'FAIL: duplicate prologue on retry'; end if;
  if (select count(*) from public.volumes where work_id='b2000000-0000-4000-8000-000000000001' and entry_type='prologue')<>1 then raise exception 'FAIL: opening count'; end if;
  if not exists(select 1 from public.volumes where work_id='b2000000-0000-4000-8000-000000000001' and title='Synthetic first volume' and entry_type='volume') then raise exception 'FAIL: existing volume changed'; end if;
  if (select is_published from public.sections where id=sid) then raise exception 'FAIL: prologue automatically published'; end if;
  if not exists(select 1 from public.sections where id=sid and title='楔子　合成测试') then raise exception 'FAIL: retry changed title'; end if;
  insert into public.section_drafts(section_id,title,subtitle,content) values(sid,'楔子　合成测试','—— 合成任务','Synthetic first scene.'||E'\n\n---\n\n'||'Synthetic second scene.');
  perform public.publish_story_section(sid,'main',0);
  if not exists(select 1 from public.sections where id=sid and subtitle='—— 合成任务' and content like '%---%') then raise exception 'FAIL: subtitle and divider publication'; end if;
  update public.section_drafts set subtitle='—— 新副标题',content='Synthetic revision' where section_id=sid;
  perform public.publish_story_section(sid,'main',0);
  if not exists(select 1 from public.revisions where section_id=sid and subtitle='—— 合成任务' and content like '%---%') then raise exception 'FAIL: subtitle revision snapshot'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"b1000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.volumes where work_id='b2000000-0000-4000-8000-000000000001') then raise exception 'FAIL: unpublished opening visible'; end if;
  begin
    perform public.create_story_prologue('b2000000-0000-4000-8000-000000000001','Forbidden');
    raise exception 'FAIL: reader can create prologue';
  exception when raise_exception then if sqlerrm<>'Access denied' then raise; end if; end;
  if exists(select 1 from public.section_drafts) then raise exception 'FAIL: private draft visible'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
update public.chapters set status='published' where volume_id in(select id from public.volumes where work_id='b2000000-0000-4000-8000-000000000001' and entry_type='prologue');
update public.volumes set is_published=true where work_id='b2000000-0000-4000-8000-000000000001' and entry_type='prologue';
select set_config('request.jwt.claims','{"sub":"b1000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ declare cid uuid; sid uuid;
begin
  select c.id,s.id into cid,sid from public.chapters c join public.sections s on s.chapter_id=c.id join public.volumes v on v.id=c.volume_id where v.work_id='b2000000-0000-4000-8000-000000000001';
  if sid is null then raise exception 'FAIL: published prologue unreadable'; end if;
  if not exists(select 1 from public.sections where id=sid and subtitle='—— 新副标题') then raise exception 'FAIL: subtitle unreadable'; end if;
  perform public.save_story_reading(cid,sid,40,false,5);
  update public.reading_progress set paragraph_index=3 where user_id=auth.uid() and chapter_id=cid;
  if not exists(select 1 from public.reading_progress where chapter_id=cid and user_id=auth.uid() and paragraph_index=3) then raise exception 'FAIL: prologue checkpoint'; end if;
end $$;
rollback;
