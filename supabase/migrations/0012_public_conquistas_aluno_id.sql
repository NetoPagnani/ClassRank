-- rpc_conquistas_publicas passa a devolver o aluno_id, para a página pública ligar
-- cada conquista ao aluno certo (antes só vinha o nome, e homônimos se misturavam).
-- Mudar as colunas de retorno exige drop + create; as permissões são repostas
-- porque os default privileges (0005) não dão EXECUTE para anon em função nova.

drop function if exists rpc_conquistas_publicas(text);

create function rpc_conquistas_publicas(p_slug text)
returns table (aluno_id uuid, aluno_nome text, conquista_nome text, conquista_icone text, data_conquistada timestamptz)
language sql security definer stable set search_path = ''
as $$
  select a.id as aluno_id, a.nome as aluno_nome, c.nome as conquista_nome, c.icone as conquista_icone, ac.data_conquistada
  from public.turmas t
  join public.alunos a on a.turma_id = t.id
  join public.aluno_conquistas ac on ac.aluno_id = a.id
  join public.conquistas c on c.id = ac.conquista_id
  where t.slug = p_slug
  order by ac.data_conquistada desc
$$;

revoke execute on function rpc_conquistas_publicas(text) from public;
grant execute on function rpc_conquistas_publicas(text) to anon, authenticated, service_role;
