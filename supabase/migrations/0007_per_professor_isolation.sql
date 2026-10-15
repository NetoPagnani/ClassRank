-- Per-professor data isolation: a professor only sees/edits their own
-- turmas, materias, alunos, tarefas, notas, avaliações, missões and
-- conquistas unlocked — not every professor's data. `conquistas` itself
-- (the fixed achievement catalog) stays shared/global, since it has no
-- owner and isn't a professor's own data.

alter table turmas add column professor_id uuid not null default auth.uid() references auth.users(id) on delete cascade;
alter table materias add column professor_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

-- turmas / materias: ownership, plus the domain gate on creation.
drop policy "professor_only" on turmas;
create policy "professor_only" on turmas for all to authenticated
  using (professor_id = (select auth.uid()))
  with check (
    professor_id = (select auth.uid())
    and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br'
  );

drop policy "professor_only" on materias;
create policy "professor_only" on materias for all to authenticated
  using (professor_id = (select auth.uid()))
  with check (
    professor_id = (select auth.uid())
    and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br'
  );

-- alunos / tarefas / missoes_semanais: owned via their direct turma_id.
drop policy "professor_only" on alunos;
create policy "professor_only" on alunos for all to authenticated
  using (exists (select 1 from turmas t where t.id = alunos.turma_id and t.professor_id = (select auth.uid())))
  with check (exists (select 1 from turmas t where t.id = alunos.turma_id and t.professor_id = (select auth.uid())));

drop policy "professor_only" on tarefas;
create policy "professor_only" on tarefas for all to authenticated
  using (exists (select 1 from turmas t where t.id = tarefas.turma_id and t.professor_id = (select auth.uid())))
  with check (exists (select 1 from turmas t where t.id = tarefas.turma_id and t.professor_id = (select auth.uid())));

drop policy "professor_only" on missoes_semanais;
create policy "professor_only" on missoes_semanais for all to authenticated
  using (exists (select 1 from turmas t where t.id = missoes_semanais.turma_id and t.professor_id = (select auth.uid())))
  with check (exists (select 1 from turmas t where t.id = missoes_semanais.turma_id and t.professor_id = (select auth.uid())));

-- notas_tarefas / avaliacoes / aluno_conquistas: owned via aluno_id -> alunos.turma_id -> turmas.
drop policy "professor_only" on notas_tarefas;
create policy "professor_only" on notas_tarefas for all to authenticated
  using (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = notas_tarefas.aluno_id and t.professor_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = notas_tarefas.aluno_id and t.professor_id = (select auth.uid())
  ));

drop policy "professor_only" on avaliacoes;
create policy "professor_only" on avaliacoes for all to authenticated
  using (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = avaliacoes.aluno_id and t.professor_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = avaliacoes.aluno_id and t.professor_id = (select auth.uid())
  ));

drop policy "professor_only" on aluno_conquistas;
create policy "professor_only" on aluno_conquistas for all to authenticated
  using (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = aluno_conquistas.aluno_id and t.professor_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = aluno_conquistas.aluno_id and t.professor_id = (select auth.uid())
  ));

-- conquistas: unchanged (shared catalog, not owned by any professor).

-- avatars storage: a professor's uploads must live under a path prefixed
-- with their own auth.uid() (e.g. "<uid>/<alunoId>-foto.png") — the SDK
-- layer (Task 5) is responsible for using that path convention.
drop policy "avatars_professor_select" on storage.objects;
drop policy "avatars_professor_insert" on storage.objects;
drop policy "avatars_professor_update" on storage.objects;
drop policy "avatars_professor_delete" on storage.objects;

create policy "avatars_professor_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "avatars_professor_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "avatars_professor_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "avatars_professor_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
