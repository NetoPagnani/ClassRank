-- ClassRank: public, slug-scoped read access for /t/:slug (anon role)
-- No table grants to anon anywhere — only EXECUTE on these 4 functions.

create or replace function rpc_turma_publica(p_slug text)
returns table (id uuid, nome text)
language sql security definer set search_path = public
as $$
  select t.id, t.nome
  from turmas t
  where t.slug = p_slug
$$;

create or replace function rpc_ranking_publico(p_slug text, p_materia_id uuid)
returns table (aluno_id uuid, nome text, foto_url text, nota_final numeric)
language sql security definer set search_path = public
as $$
  with turma as (
    select id from turmas where slug = p_slug
  ),
  medias as (
    select nt.aluno_id, avg(nt.nota / t.nota_maxima * 10) as media_tarefas
    from notas_tarefas nt
    join tarefas t on t.id = nt.tarefa_id
    where t.materia_id = p_materia_id
      and t.turma_id = (select id from turma)
    group by nt.aluno_id
  )
  select
    a.id as aluno_id,
    a.nome,
    a.foto_url,
    (coalesce(m.media_tarefas, 0) + coalesce(av.prova1, 0) + coalesce(av.prova2, 0) + coalesce(av.participacao, 0)) / 4 as nota_final
  from alunos a
  join turma tu on a.turma_id = tu.id
  left join avaliacoes av on av.aluno_id = a.id and av.materia_id = p_materia_id
  left join medias m on m.aluno_id = a.id
  order by nota_final desc nulls last
$$;

create or replace function rpc_conquistas_publicas(p_slug text)
returns table (aluno_nome text, conquista_nome text, conquista_icone text, data_conquistada timestamptz)
language sql security definer set search_path = public
as $$
  select a.nome as aluno_nome, c.nome as conquista_nome, c.icone as conquista_icone, ac.data_conquistada
  from turmas t
  join alunos a on a.turma_id = t.id
  join aluno_conquistas ac on ac.aluno_id = a.id
  join conquistas c on c.id = ac.conquista_id
  where t.slug = p_slug
  order by ac.data_conquistada desc
$$;

create or replace function rpc_missao_publica(p_slug text)
returns table (titulo text, descricao text, meta numeric, progresso_atual numeric)
language sql security definer set search_path = public
as $$
  select m.titulo, m.descricao, m.meta, m.progresso_atual
  from turmas t
  join missoes_semanais m on m.turma_id = t.id
  where t.slug = p_slug
  order by m.semana_referencia desc nulls last
  limit 1
$$;

grant execute on function rpc_turma_publica(text) to anon;
grant execute on function rpc_ranking_publico(text, uuid) to anon;
grant execute on function rpc_conquistas_publicas(text) to anon;
grant execute on function rpc_missao_publica(text) to anon;
