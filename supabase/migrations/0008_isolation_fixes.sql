-- Fixes from the per-professor isolation review:
--  Critical: `conquistas` (the shared achievement catalog) was left on its
--  old `for all` policy, so any professor could update/delete it — and
--  since aluno_conquistas.conquista_id is `on delete cascade`, a delete
--  there bypasses RLS and wipes every OTHER professor's students'
--  unlocked achievements too. The app only ever reads this table
--  (conquistasRepository.listCatalogo) — make it select-only.
--  Important: WITH CHECK on tarefas/avaliacoes only verified turma/aluno
--  ownership, not the second FK (materia_id / tarefa_id) — a professor
--  could attach their own row to another professor's materia/tarefa by
--  UUID. Add the missing ownership check to each.
--  Minor: index the two new professor_id columns (also clears the
--  unindexed-FK performance advisory for them).

drop policy "professor_only" on conquistas;
create policy "professor_read" on conquistas for select to authenticated
  using ((select auth.jwt()) ->> 'email' like '%@professor.educacao.sp.gov.br');

drop policy "professor_only" on tarefas;
create policy "professor_only" on tarefas for all to authenticated
  using (exists (select 1 from turmas t where t.id = tarefas.turma_id and t.professor_id = (select auth.uid())))
  with check (
    exists (select 1 from turmas t where t.id = tarefas.turma_id and t.professor_id = (select auth.uid()))
    and exists (select 1 from materias m where m.id = tarefas.materia_id and m.professor_id = (select auth.uid()))
  );

drop policy "professor_only" on avaliacoes;
create policy "professor_only" on avaliacoes for all to authenticated
  using (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = avaliacoes.aluno_id and t.professor_id = (select auth.uid())
  ))
  with check (
    exists (
      select 1 from alunos a join turmas t on t.id = a.turma_id
      where a.id = avaliacoes.aluno_id and t.professor_id = (select auth.uid())
    )
    and exists (select 1 from materias m where m.id = avaliacoes.materia_id and m.professor_id = (select auth.uid()))
  );

drop policy "professor_only" on notas_tarefas;
create policy "professor_only" on notas_tarefas for all to authenticated
  using (exists (
    select 1 from alunos a join turmas t on t.id = a.turma_id
    where a.id = notas_tarefas.aluno_id and t.professor_id = (select auth.uid())
  ))
  with check (
    exists (
      select 1 from alunos a join turmas t on t.id = a.turma_id
      where a.id = notas_tarefas.aluno_id and t.professor_id = (select auth.uid())
    )
    and exists (
      select 1 from tarefas tf join turmas t on t.id = tf.turma_id
      where tf.id = notas_tarefas.tarefa_id and t.professor_id = (select auth.uid())
    )
  );

create index if not exists turmas_professor_id_idx on turmas(professor_id);
create index if not exists materias_professor_id_idx on materias(professor_id);
