# EduQuest — Contexto da sessão (para continuar depois)

## O que é

App web (Vue 3 + Supabase) para o professor gerenciar turmas, matérias e alunos, lançar tarefas do CMSP/notas/provas/participação, com ranking gamificado estilo jogo retrô (pódio, conquistas, missão semanal). Alunos acessam o ranking da própria turma por um link público (`/t/:slug`), sem login.

## Links

- **Site ao vivo:** https://eduquestneto.vercel.app
- **Repositório:** https://github.com/NetoPagnani/ClassRank
- **Projeto Supabase:** jrymjuplubalpvlqmpzr (org "Projetos Escolar")
- **Projeto Vercel:** `edu-quest` (prj_8yeDuVLFSvm9KB9EZ2DLiumNrqUK), domínio `eduquestneto.vercel.app`
- Pasta local: `/mnt/Arquivos/Documentos/ClassRank`

## Stack

Vue 3 (`<script setup>`) + Vite + Pinia + Vue Router + Tailwind CSS + Supabase (Postgres/Auth/Storage, RLS) + Vitest. Deploy automático: todo push em `master` no GitHub dispara build no Vercel.

## Como o acesso funciona

- Professor: cadastro aberto, mas só e-mails `@professor.educacao.sp.gov.br` conseguem gravar dado (checado via RLS no banco, não só no front).
- Cada professor só vê/edita as próprias turmas/alunos/notas (isolamento por `professor_id`).
- Aluno: sem conta, acessa só o pódio da própria turma via link público (RPCs `SECURITY DEFINER` no banco, scoped por slug).

## O que já está pronto

- Login/cadastro de professor, turmas, matérias (ligadas por turma via tabela `turma_materias`), alunos (foto real ou avatar padrão escolhível, editar nome, excluir).
- Lançamento de tarefas CMSP + notas + Prova 1/2/Participação, ranking automático, pódio Top 3, histórico de tarefas por aluno.
- 3 conquistas automáticas (pontual, nota máxima, presença exemplar) + missão semanal por turma (editável pelo professor).
- Tema visual pixel-art (fontes Press Start 2P/VT323, paleta navy/dourado, imagens geradas: logo, cenário, baú, 2 avatares padrão).
- Testes automatizados (Vitest) cobrindo stores e repositórios, caminho de erro incluído.
- MIT License, README, deploy no Vercel com variáveis de ambiente e `vercel.json` (rewrite de SPA) configurados.

## O que ainda NÃO foi feito (pendências conhecidas)

- **Importação de notas via CSV/Excel**: existe a lógica pronta (`src/domain/importParsers/`), mas não tem botão/tela ligando isso ao Ranking — hoje o lançamento de nota é manual, uma por uma.
- Não há confirmação de que a opção "Confirm email" do Supabase Auth está ativada (recomendado checar em Authentication → Settings, por segurança do domínio `@professor...`).
- Sem testes end-to-end automatizados (só testes unitários de store/repositório); todo teste de UI foi feito manualmente durante a sessão.
- Pódio/ranking só considera 1 matéria por vez (não existe uma visão "geral" somando todas as matérias do aluno).

## Decisões/observações importantes

- Nome do app: **EduQuest** (era "ClassRank" até a metade da sessão).
- Commits no GitHub não têm o Claude como coautor (removido de propósito via reescrita de histórico).
- Push para o GitHub usa SSH (chave já cadastrada na conta `NetoPagnani`).
- Variáveis de ambiente (Supabase) já estão configuradas tanto no `.env.local` local quanto no Vercel.
