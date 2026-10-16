-- EduQuest: liga explicitamente quais matérias (do catálogo global,
-- compartilhado entre professores) cada turma usa, para o professor poder
-- escolher as matérias de uma turma em vez de ver o catálogo inteiro
-- desconectado.

create table turma_materias (
  turma_id uuid not null references turmas(id) on delete cascade,
  materia_id uuid not null references materias(id) on delete cascade,
  primary key (turma_id, materia_id)
);

alter table turma_materias enable row level security;

create policy "professor_only" on turma_materias for all to authenticated
  using (exists (select 1 from turmas t where t.id = turma_materias.turma_id and t.professor_id = (select auth.uid())))
  with check (exists (select 1 from turmas t where t.id = turma_materias.turma_id and t.professor_id = (select auth.uid())));

revoke all on turma_materias from anon;
