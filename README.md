# [EduQuest](https://eduquestneto.vercel.app/login)

Aplicativo web para o professor acompanhar tarefas do CMSP, lançar notas e participação dos alunos, com um ranking gamificado (estilo jogo retrô, pixel art) por turma. Alunos acessam o ranking da própria turma por um link público, sem precisar de conta.

## Funcionalidades

- Login/cadastro do professor restrito a e-mails `@professor.educacao.sp.gov.br`.
- Gestão de turmas, matérias (ligadas por turma) e alunos, com foto real ou avatar padrão.
- Lançamento de tarefas do CMSP, notas e provas (Prova 1, Prova 2, Participação).
- Ranking automático com pódio Top 3, histórico de tarefas por aluno.
- Conquistas automáticas (pontual, nota máxima, presença exemplar) e missão semanal por turma.
- Link público por turma (`/t/:slug`) para os alunos verem o ranking, sem login.

## Stack

- Vue 3 (Composition API, `<script setup>`) + Vite + Pinia + Vue Router
- Tailwind CSS
- Supabase (Postgres, Auth, Storage) com Row Level Security
- Vitest + @vue/test-utils

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Variáveis de ambiente necessárias (`.env.local`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — pré-visualiza o build de produção
- `npm test` — roda os testes (Vitest)

## Banco de dados

As migrations do Supabase estão em `supabase/migrations/`, aplicadas em ordem. O schema cobre turmas, matérias, alunos, tarefas, notas, avaliações, conquistas e missões semanais, com RLS isolando os dados de cada professor e RPCs `SECURITY DEFINER` para o acesso público somente-leitura via `/t/:slug`.

## Licença

Distribuído sob a licença MIT — veja [LICENSE](LICENSE).
