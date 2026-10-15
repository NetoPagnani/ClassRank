-- ClassRank: base schema, authenticated-only RLS

create table turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  created_at timestamptz not null default now()
);

create table materias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table alunos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  nome text not null,
  foto_url text,
  created_at timestamptz not null default now()
);

create table tarefas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  materia_id uuid not null references materias(id) on delete cascade,
  titulo text not null,
  cmsp_link text,
  data_entrega date not null,
  nota_maxima numeric not null check (nota_maxima > 0),
  created_at timestamptz not null default now()
);

create table notas_tarefas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  tarefa_id uuid not null references tarefas(id) on delete cascade,
  nota numeric not null,
  entregue_em timestamptz,
  unique (aluno_id, tarefa_id)
);

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  materia_id uuid not null references materias(id) on delete cascade,
  prova1 numeric,
  prova2 numeric,
  participacao numeric,
  unique (aluno_id, materia_id)
);

create table conquistas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nome text not null,
  descricao text,
  icone text
);

create table aluno_conquistas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  conquista_id uuid not null references conquistas(id) on delete cascade,
  data_conquistada timestamptz not null default now(),
  unique (aluno_id, conquista_id)
);

create table missoes_semanais (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  titulo text not null,
  descricao text,
  meta numeric,
  progresso_atual numeric not null default 0,
  semana_referencia date
);

alter table turmas enable row level security;
alter table materias enable row level security;
alter table alunos enable row level security;
alter table tarefas enable row level security;
alter table notas_tarefas enable row level security;
alter table avaliacoes enable row level security;
alter table conquistas enable row level security;
alter table aluno_conquistas enable row level security;
alter table missoes_semanais enable row level security;

create policy "authenticated_all" on turmas for all to authenticated using (true) with check (true);
create policy "authenticated_all" on materias for all to authenticated using (true) with check (true);
create policy "authenticated_all" on alunos for all to authenticated using (true) with check (true);
create policy "authenticated_all" on tarefas for all to authenticated using (true) with check (true);
create policy "authenticated_all" on notas_tarefas for all to authenticated using (true) with check (true);
create policy "authenticated_all" on avaliacoes for all to authenticated using (true) with check (true);
create policy "authenticated_all" on conquistas for all to authenticated using (true) with check (true);
create policy "authenticated_all" on aluno_conquistas for all to authenticated using (true) with check (true);
create policy "authenticated_all" on missoes_semanais for all to authenticated using (true) with check (true);

-- Fixed achievement catalog (codes must match src/domain/conquistaRules/*.js exactly)
insert into conquistas (codigo, nome, descricao, icone) values
  ('pontual', 'Pontual', 'Entregou todas as tarefas da matéria antes do prazo', 'clock'),
  ('nota_maxima', 'Nota Máxima', 'Nota final maior ou igual a 9 em alguma matéria', 'star'),
  ('presenca_exemplar', 'Presença Exemplar', 'Participação maior ou igual a 9 em todas as matérias', 'shield');
