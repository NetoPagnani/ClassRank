-- Fixes from Task 2's security review:
--  Critical: RLS policies only checked "is authenticated", not "is a
--  teacher" — with Supabase's default open sign-up, anyone could register
--  and get full read/write on every table. Scope every policy to accounts
--  whose email ends in @professor.educacao.sp.gov.br instead — that's an
--  institutional domain only the SP education department can issue, so any
--  teacher with a real account there is trusted, without a hardcoded
--  single email or a separate allowlist table to maintain.
--  Important: the public SELECT policy on storage.objects let anyone list
--  every avatar across every turma (the public bucket already serves files
--  by URL without it) — drop it.
--  Important: default privileges only covered today's tables/functions —
--  lock down future ones too.
--  Minor: schema-qualify RPC bodies + empty search_path (defense in depth
--  beyond the already-pinned `set search_path = public`), mark the RPCs
--  STABLE, add a tie-breaker to the ranking order, add the missing
--  missoes_semanais uniqueness, strengthen the slug generator, fix the
--  "pontual" seed wording (rule is <=, i.e. "até o prazo", not "antes").

-- 1) Restrict every authenticated_all policy to @professor.educacao.sp.gov.br accounts.
drop policy "authenticated_all" on turmas;
drop policy "authenticated_all" on materias;
drop policy "authenticated_all" on alunos;
drop policy "authenticated_all" on tarefas;
drop policy "authenticated_all" on notas_tarefas;
drop policy "authenticated_all" on avaliacoes;
drop policy "authenticated_all" on conquistas;
drop policy "authenticated_all" on aluno_conquistas;
drop policy "authenticated_all" on missoes_semanais;

create policy "professor_only" on turmas for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on materias for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on alunos for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on tarefas for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on notas_tarefas for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on avaliacoes for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on conquistas for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on aluno_conquistas for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');
create policy "professor_only" on missoes_semanais for all to authenticated
  using (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br')
  with check (auth.jwt() ->> 'email' like '%@professor.educacao.sp.gov.br');

-- 2) Drop the public-listing storage policy; the bucket is already public=true
--    so GET-by-URL (what the app needs) keeps working without it.
drop policy "avatars_public_read" on storage.objects;

-- 3) Lock down default privileges for tables/functions created by future migrations.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, public;

-- 4) Harden + polish the 4 RPCs: empty search_path with schema-qualified
--    names, STABLE, and a name tie-breaker in the ranking order.
create or replace function rpc_turma_publica(p_slug text)
returns table (id uuid, nome text)
language sql security definer stable set search_path = ''
as $$
  select t.id, t.nome
  from public.turmas t
  where t.slug = p_slug
$$;

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
    (coalesce(m.media_tarefas, 0) + coalesce(av.prova1, 0) + coalesce(av.prova2, 0) + coalesce(av.participacao, 0)) / 4 as nota_final
  from public.alunos a
  join turma tu on a.turma_id = tu.id
  left join public.avaliacoes av on av.aluno_id = a.id and av.materia_id = p_materia_id
  left join medias m on m.aluno_id = a.id
  order by nota_final desc nulls last, a.nome asc
$$;

create or replace function rpc_conquistas_publicas(p_slug text)
returns table (aluno_nome text, conquista_nome text, conquista_icone text, data_conquistada timestamptz)
language sql security definer stable set search_path = ''
as $$
  select a.nome as aluno_nome, c.nome as conquista_nome, c.icone as conquista_icone, ac.data_conquistada
  from public.turmas t
  join public.alunos a on a.turma_id = t.id
  join public.aluno_conquistas ac on ac.aluno_id = a.id
  join public.conquistas c on c.id = ac.conquista_id
  where t.slug = p_slug
  order by ac.data_conquistada desc
$$;

create or replace function rpc_missao_publica(p_slug text)
returns table (titulo text, descricao text, meta numeric, progresso_atual numeric)
language sql security definer stable set search_path = ''
as $$
  select m.titulo, m.descricao, m.meta, m.progresso_atual
  from public.turmas t
  join public.missoes_semanais m on m.turma_id = t.id
  where t.slug = p_slug
  order by m.semana_referencia desc nulls last
  limit 1
$$;

-- 5) missoes_semanais needs a conflict target for Task 7's upsert (one
--    mission per turma per week), same as the other 3 upsert-backed tables.
alter table missoes_semanais add constraint missoes_semanais_turma_semana_key unique (turma_id, semana_referencia);

-- 6) Stronger slug generator (cryptographic bytes instead of md5(random())).
alter table turmas alter column slug set default encode(extensions.gen_random_bytes(8), 'hex');

-- 7) Wording fix: pontualRule is "<=" prazo, i.e. on-or-before, not strictly before.
update conquistas set descricao = 'Entregou todas as tarefas da matéria até o prazo'
  where codigo = 'pontual';
