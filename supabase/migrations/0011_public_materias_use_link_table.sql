-- EduQuest: now that turma_materias exists (professor explicitly picks
-- which materias a turma uses), the public materia selector should read
-- from that link instead of inferring from whether tarefas exist yet —
-- otherwise a materia linked but with no tasks graded yet wouldn't show
-- up for students at all.

create or replace function rpc_materias_turma_publica(p_slug text)
returns table (id uuid, nome text)
language sql security definer set search_path = public
stable
as $$
  select m.id, m.nome
  from materias m
  join turma_materias tm on tm.materia_id = m.id
  join turmas tu on tu.id = tm.turma_id
  where tu.slug = p_slug
$$;
