-- Round 2: scoped re-review of 0005 found two of the three fixes were only
-- partial, plus one new gap introduced by the fix itself.
--  Critical (still open): the 3 storage write policies on `avatars` were
--  never touched by 0005 — any self-registered user could still upload,
--  overwrite or delete every student's photo.
--  Important (still open): `alter default privileges ... in schema public
--  revoke execute on functions from anon, public` is a no-op for the
--  `public` part — PUBLIC's default EXECUTE grant on new functions is a
--  global default, and a per-schema revoke cannot override a global grant.
--  New Important (introduced by 0005): dropping `avatars_public_read` left
--  NO select policy on storage.objects at all. The public bucket's
--  GET-by-URL endpoint doesn't need one, but the Storage SDK's own
--  upsert/remove calls do (upsert needs select+insert+update, remove needs
--  select+delete) — without it, replacing or deleting a photo silently
--  fails. Add a select policy scoped the same way as the writes, not a
--  public one.
--  Minor (bundled): explicit pgcrypto extension declaration, NOT NULL on
--  missoes_semanais.semana_referencia (a null there defeats its own unique
--  constraint, since NULLs never conflict), and wrap auth.jwt() as
--  `(select auth.jwt())` in every policy per Supabase's auth_rls_initplan
--  performance advisory (the security advisors stayed clean because this
--  is a performance lint, not a security one).

create extension if not exists pgcrypto with schema extensions;

-- 1) Re-scope the 9 table policies with the initplan-friendly form.
drop policy "professor_only" on turmas;
drop policy "professor_only" on materias;
drop policy "professor_only" on alunos;
drop policy "professor_only" on tarefas;
drop policy "professor_only" on notas_tarefas;
drop policy "professor_only" on avaliacoes;
drop policy "professor_only" on conquistas;
drop policy "professor_only" on aluno_conquistas;
drop policy "professor_only" on missoes_semanais;

create policy "professor_only" on turmas for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on materias for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on alunos for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on tarefas for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on notas_tarefas for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on avaliacoes for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on conquistas for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on aluno_conquistas for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on missoes_semanais for all to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');

-- 2) Re-scope the 3 storage write policies to the professor domain, and add
--    the missing select policy (needed by the Storage SDK's own calls, not
--    by the public bucket's GET-by-URL endpoint).
drop policy "avatars_authenticated_write" on storage.objects;
drop policy "avatars_authenticated_update" on storage.objects;
drop policy "avatars_authenticated_delete" on storage.objects;

create policy "avatars_professor_select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "avatars_professor_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "avatars_professor_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "avatars_professor_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');

-- 3) Fix the PUBLIC function-EXECUTE default: a per-schema revoke cannot
--    override PUBLIC's global default grant, so this must be unscoped.
alter default privileges for role postgres revoke execute on functions from public;

-- 4) A null semana_referencia defeats missoes_semanais' own unique
--    constraint (NULLs never conflict with each other).
alter table missoes_semanais alter column semana_referencia set not null;
