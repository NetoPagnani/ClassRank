-- avatars bucket: public read (photos must render on the public /t/:slug route), authenticated write only.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select to public using (bucket_id = 'avatars');
create policy "avatars_authenticated_write" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy "avatars_authenticated_update" on storage.objects for update to authenticated using (bucket_id = 'avatars');
create policy "avatars_authenticated_delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars');
