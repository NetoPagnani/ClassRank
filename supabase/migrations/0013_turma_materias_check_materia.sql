-- turma_materias: o WITH CHECK só conferia se a turma era do professor, não a
-- matéria — dava para ligar à própria turma a matéria de outro professor (pelo
-- UUID) e o nome dela aparecia na página pública. Mesma checagem dupla que
-- tarefas/avaliacoes já fazem (0008).

drop policy "professor_only" on turma_materias;
create policy "professor_only" on turma_materias for all to authenticated
  using (exists (select 1 from turmas t where t.id = turma_materias.turma_id and t.professor_id = (select auth.uid())))
  with check (
    exists (select 1 from turmas t where t.id = turma_materias.turma_id and t.professor_id = (select auth.uid()))
    and exists (select 1 from materias m where m.id = turma_materias.materia_id and m.professor_id = (select auth.uid()))
  );
