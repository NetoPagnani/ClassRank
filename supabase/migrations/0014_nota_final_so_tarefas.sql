-- Prova 1, Prova 2 e Participação saíram do app: a nota final do ranking público
-- passa a ser só a média das tarefas. A tabela avaliacoes fica no banco com os
-- valores já lançados, mas não entra mais no cálculo.
create or replace function rpc_ranking_publico(p_slug text, p_materia_id uuid)
returns table (aluno_id uuid, nome text, foto_url text, nota_final numeric)
language sql security definer stable set search_path = ''
as $$
  with turma as (
    select id from public.turmas where slug = p_slug
  ),
  medias as (
    select nt.aluno_id, avg(nt.nota / t.nota_maxima * 10) as media_tarefas
    from public.notas_tarefas nt
    join public.tarefas t on t.id = nt.tarefa_id
    where t.materia_id = p_materia_id
      and t.turma_id = (select id from turma)
    group by nt.aluno_id
  )
  select
    a.id as aluno_id,
    a.nome,
    a.foto_url,
    coalesce(m.media_tarefas, 0) as nota_final
  from public.alunos a
  join turma tu on a.turma_id = tu.id
  left join medias m on m.aluno_id = a.id
  order by nota_final desc nulls last, a.nome asc
$$;
