-- ClassRank: public RPC to list only the materias that actually have
-- tarefas in a given (public) turma, so /t/:slug can offer a materia
-- selector without exposing every professor's full materias catalog.

create or replace function rpc_materias_turma_publica(p_slug text)
returns table (id uuid, nome text)
language sql security definer set search_path = public
stable
as $$
  select distinct m.id, m.nome
  from materias m
  join tarefas t on t.materia_id = m.id
  join turmas tu on tu.id = t.turma_id
  where tu.slug = p_slug
$$;

grant execute on function rpc_materias_turma_publica(text) to anon;
