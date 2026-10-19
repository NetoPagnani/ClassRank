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

- Login/cadastro de professor com recuperação de senha ("Esqueci minha senha" no login → e-mail → tela `/redefinir-senha`), turmas, matérias (ligadas por turma via tabela `turma_materias`), alunos (foto real ou avatar padrão escolhível, editar nome, excluir).
- Lançamento de tarefas CMSP + notas + Prova 1/2/Participação, ranking automático, pódio Top 3 (empatados dividem o degrau), histórico de tarefas por aluno.
- Importação de notas por planilha no Ranking: botão "Baixar modelo" (.xlsx já com todos os alunos da turma) e envio de CSV/Excel com prévia antes de lançar (nomes comparados sem acento/maiúscula; nota em branco é ignorada).
- Página pública da turma (`/t/:slug`) com visual de jogo: cenário com castelo, pódio com coroas, placas de madeira, tabela com todos os alunos e conquistas, missão da semana, conquista recente e frase.
- 3 conquistas automáticas (pontual, nota máxima, presença exemplar) + missão semanal por turma (editável pelo professor).
- Tema visual pixel-art (fontes Press Start 2P/VT323/Nunito, paleta navy/dourado, imagens geradas: logo, cenários, baú, 2 avatares padrão). Avatar padrão fica gravado no banco como `padrao:feminino`/`padrao:masculino` (não como link do build).
- Modelos dos e-mails de confirmação de conta e de troca de senha em `supabase/templates/` (o assunto está no comentário do topo de cada arquivo).
- Testes automatizados (Vitest, 158 testes) cobrindo stores, repositórios e regras de domínio (empate, importação de planilha, avatar), caminho de erro incluído.
- MIT License, README, deploy no Vercel com variáveis de ambiente e `vercel.json` (rewrite de SPA) configurados.

## Onde paramos (19/10/2026)

Tudo do código está publicado (último commit no ar: `60fdab3`, recuperação de senha). Falta só a **configuração dos e-mails no painel do Supabase**, que o professor faz à mão (o Claude não tem acesso a essas telas e não deve receber senhas):

1. **Criar um Gmail só para o EduQuest** (decidido: não usar o e-mail pessoal), ativar a Verificação em duas etapas e gerar uma **senha de app** em https://myaccount.google.com/apppasswords.
2. **SMTP próprio no Supabase**: https://supabase.com/dashboard/project/jrymjuplubalpvlqmpzr/auth/smtp → ligar "Enable Custom SMTP" → Sender email e Username = o Gmail novo, Sender name = `EduQuest`, Host = `smtp.gmail.com`, Port = `465`, Password = a senha de app → Save.
   - Sem SMTP próprio o Supabase **trava a edição dos modelos de e-mail** e manda tudo em inglês, com limite baixo de envios por hora.
   - Cuidado: a setinha ao lado do botão "Set up SMTP" abre "Add Send Email hook" — **não criar esse hook** (sem função configurada ele para todos os e-mails).
3. **Modelos dos e-mails**: https://supabase.com/dashboard/project/jrymjuplubalpvlqmpzr/auth/templates → em cada modelo, clicar em **Source**, apagar o conteúdo e colar o arquivo:
   - "Confirm signup": assunto `Confirme sua conta no EduQuest`, corpo = `supabase/templates/confirmar-conta.html`
   - "Reset Password": assunto `Crie uma nova senha no EduQuest`, corpo = `supabase/templates/recuperar-senha.html`
4. **Redirect URLs**: https://supabase.com/dashboard/project/jrymjuplubalpvlqmpzr/auth/url-configuration → garantir `https://eduquestneto.vercel.app/**` (senão o link de troca de senha cai na página inicial).
5. **Testar**: sair do app, "Esqueci minha senha" com o próprio e-mail, abrir o link e criar a senha nova (esse fluxo ainda não foi testado de ponta a ponta com e-mail real).

## O que ainda NÃO foi feito (pendências conhecidas)

- Configuração dos e-mails no Supabase (passos acima).
- A turma 2º A ainda não tem missão da semana nem conquistas no banco, então esses painéis da página pública ficam escondidos até o professor cadastrar/lançar.
- Sem testes end-to-end automatizados (só testes unitários de store/repositório); todo teste de UI foi feito manualmente durante a sessão.
- Pódio/ranking só considera 1 matéria por vez (não existe uma visão "geral" somando todas as matérias do aluno).

## Como trabalhar neste projeto (regras combinadas)

- **Commits sem coautoria do Claude**: nada de linha `Co-Authored-By: Claude` nem menção ao Claude nas mensagens; autor sempre Orlando Pagnani.
- **Push em `master` publica no site** (Vercel): só fazer push com o ok do professor; commit local pode.
- Antes de commitar: `npm test` e `npm run build` passando.
- Para testar telas logadas no navegador do app, o próprio professor faz o login; o Claude nunca digita senha.
- Teste de importação de notas: parar na prévia e clicar em "Cancelar", para não gravar nota de mentira no banco real.

## Decisões/observações importantes

- Nome do app: **EduQuest** (era "ClassRank" até a metade da sessão).
- Commits no GitHub não têm o Claude como coautor (removido de propósito via reescrita de histórico). A lista "Contributors" da página do repositório ainda pode mostrar "claude" por cache do GitHub; a API já lista só NetoPagnani.
- "Confirm email" do Supabase Auth está ligado (conferido em 18/10/2026 pela conta existente, confirmada por e-mail).
- Push para o GitHub usa SSH (chave já cadastrada na conta `NetoPagnani`).
- Variáveis de ambiente (Supabase) já estão configuradas tanto no `.env.local` local quanto no Vercel.
- Migrations ficam em `supabase/migrations/` (até `0012`, que fez a página pública ligar conquistas pelo id do aluno) e já estão aplicadas no projeto Supabase.
- Canvas do redesign da página pública (Claude Design): https://claude.ai/artifact/7FLBfPTzJM15h9CApzvG27
