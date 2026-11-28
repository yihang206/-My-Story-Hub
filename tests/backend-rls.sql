-- Synthetic data exists only inside this transaction and is always rolled back.
-- Run against the audited project as the maintenance connection, never a browser.
begin;
set local statement_timeout = '15s';
insert into auth.users (id, email, aud, role) values
('a1000000-0000-4000-8000-000000000001','rls-admin@example.invalid','authenticated','authenticated'),
('a1000000-0000-4000-8000-000000000002','rls-reader@example.invalid','authenticated','authenticated'),
('a1000000-0000-4000-8000-000000000003','rls-denied@example.invalid','authenticated','authenticated'),
('a1000000-0000-4000-8000-000000000004','rls-disabled@example.invalid','authenticated','authenticated');
insert into public.profiles(id,display_name,role,is_active) values
('a1000000-0000-4000-8000-000000000001','RLS test admin','admin',true),
('a1000000-0000-4000-8000-000000000002','RLS test reader','reader',true),
('a1000000-0000-4000-8000-000000000003','RLS test denied','reader',true),
('a1000000-0000-4000-8000-000000000004','RLS test disabled','reader',false);
insert into public.works(id,title,is_published) values ('a2000000-0000-4000-8000-000000000001','RLS synthetic work',true);
insert into public.volumes(id,work_id,title,is_published) values ('a3000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000001','RLS synthetic volume',true);
insert into public.chapters(id,volume_id,title,status) values ('a4000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','RLS synthetic chapter','published');
insert into public.sections(id,chapter_id,title,content,is_published) values
('a5000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001','RLS published section','Synthetic published text',true),
('a5000000-0000-4000-8000-000000000002','a4000000-0000-4000-8000-000000000001','RLS private draft','Synthetic private text',false);
insert into public.section_drafts(section_id,title,content) values ('a5000000-0000-4000-8000-000000000002','RLS draft title','Synthetic draft body');
insert into public.work_access(user_id,work_id,is_active) values
('a1000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001',true),
('a1000000-0000-4000-8000-000000000004','a2000000-0000-4000-8000-000000000001',true);

set local role anon;
do $$ begin
  begin
    perform 1 from public.works;
    raise exception 'FAIL: anonymous table access';
  exception when insufficient_privilege then null; end;
  begin
    perform public.publish_story_section('a5000000-0000-4000-8000-000000000002','main',20);
    raise exception 'FAIL: anonymous RPC execution';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.works where id='a2000000-0000-4000-8000-000000000001') <> 1 then raise exception 'FAIL: granted work not readable'; end if;
  if (select count(*) from public.sections where chapter_id='a4000000-0000-4000-8000-000000000001') <> 1 then raise exception 'FAIL: draft leaked to reader'; end if;
  if exists(select 1 from public.section_drafts) then raise exception 'FAIL: drafts table leaked'; end if;
  begin
    insert into public.works(title) values ('forbidden reader insert');
    raise exception 'FAIL: reader may create works';
  exception when insufficient_privilege then null; end;
  update public.profiles set role='admin' where id=auth.uid();
  if story_private.is_admin() then raise exception 'FAIL: reader promoted self'; end if;
  perform public.update_story_display_name('Renamed test reader');
  if not exists(select 1 from public.profiles where id=auth.uid() and display_name='Renamed test reader' and role='reader') then raise exception 'FAIL: narrow display-name update'; end if;
  begin
    insert into storage.objects(bucket_id,name) values ('story-art','covers/rls-reader-denied.webp');
    raise exception 'FAIL: reader may upload private art';
  exception when insufficient_privilege then null; end;
  perform public.save_story_reading('a4000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001',50,false,7);
  perform public.save_story_reading('a4000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001',100,true,3);
  if (select active_seconds from public.reading_stats where chapter_id='a4000000-0000-4000-8000-000000000001') <> 10 then raise exception 'FAIL: reading seconds'; end if;
  if not (select is_completed from public.reading_progress where chapter_id='a4000000-0000-4000-8000-000000000001') then raise exception 'FAIL: reading completion'; end if;
  update public.reading_progress set paragraph_index=19 where user_id=auth.uid() and chapter_id='a4000000-0000-4000-8000-000000000001';
  if (select paragraph_index from public.reading_progress where user_id=auth.uid() and chapter_id='a4000000-0000-4000-8000-000000000001') <> 19 then raise exception 'FAIL: own paragraph checkpoint'; end if;
  insert into public.reader_notes(user_id,section_id,content,share_with_author) values
  (auth.uid(),'a5000000-0000-4000-8000-000000000001','RLS private note',false),
  (auth.uid(),'a5000000-0000-4000-8000-000000000001','RLS shared note',true);
end $$;

select set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.works where id='a2000000-0000-4000-8000-000000000001') then raise exception 'FAIL: unauthorized work'; end if;
  if exists(select 1 from public.reading_progress where user_id='a1000000-0000-4000-8000-000000000002') then raise exception 'FAIL: another reader progress'; end if;
  if exists(select 1 from public.reader_notes where user_id='a1000000-0000-4000-8000-000000000002') then raise exception 'FAIL: another reader notes'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.works where id='a2000000-0000-4000-8000-000000000001') then raise exception 'FAIL: disabled account can read'; end if;
  if exists(select 1 from storage.objects where bucket_id='story-art') then raise exception 'FAIL: disabled account can read art'; end if;
  begin
    perform public.save_story_reading('a4000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001',50,false,7);
    raise exception 'FAIL: disabled account can sync';
  exception when raise_exception then if sqlerrm <> 'Access denied' then raise; end if; end;
end $$;

select set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  if not story_private.is_admin() then raise exception 'FAIL: admin role'; end if;
  insert into storage.objects(bucket_id,name) values ('story-art','covers/rls-admin-allowed.webp');
  begin
    insert into storage.objects(bucket_id,name) values ('story-art','rls-root-denied.webp');
    raise exception 'FAIL: admin cover policy permits root uploads';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.sections where chapter_id='a4000000-0000-4000-8000-000000000001') <> 2 then raise exception 'FAIL: admin draft preview'; end if;
  if exists(select 1 from public.reader_notes where content='RLS private note') then raise exception 'FAIL: private note visible to author'; end if;
  if not exists(select 1 from public.reader_notes where content='RLS shared note') then raise exception 'FAIL: shared note hidden from author'; end if;
  perform public.publish_story_section('a5000000-0000-4000-8000-000000000002','main',20);
  if not (select is_published from public.sections where id='a5000000-0000-4000-8000-000000000002') then raise exception 'FAIL: publish RPC'; end if;
  update public.section_drafts set content='Synthetic revised body' where section_id='a5000000-0000-4000-8000-000000000002';
  perform public.publish_story_section('a5000000-0000-4000-8000-000000000002','main',20);
  if not exists(select 1 from public.revisions where section_id='a5000000-0000-4000-8000-000000000002' and content='Synthetic draft body') then raise exception 'FAIL: revision capture'; end if;
end $$;
reset role;
rollback;
select 'PASS: anonymous, admin, granted reader, denied reader, disabled reader, draft separation, RPC publication/revision, reading accumulation and private notes; fixture transaction rolled back' as result;
