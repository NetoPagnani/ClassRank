# EduQuest — Guia rápido

**Site:** https://eduquestneto.vercel.app
**Repositório:** https://github.com/NetoPagnani/ClassRank

## Como entrar

1. Abra o site, clique em **"Ainda não tem conta? Criar conta"**.
2. Use um e-mail terminado em `@professor.educacao.sp.gov.br`.
3. Depois de criar, faça login normalmente.

## O que testar

- **Turmas**: criar turma, criar matéria (fica só dentro da turma), ligar/desligar matéria na turma, excluir turma/matéria.
- **Alunos**: adicionar aluno, trocar nome (Editar), excluir, trocar avatar padrão (os dois quadradinhos) ou subir foto real (Escolher arquivo).
- **Ranking**: escolher turma + matéria, cadastrar uma tarefa do CMSP, lançar nota da tarefa + Prova 1 + Prova 2 + Participação, ver o pódio Top 3 e o histórico de cada aluno ("Ver").
- **Missão da semana**: em Turmas, com uma turma selecionada, criar/editar a missão (título, meta, progresso).
- **Conquistas**: catálogo geral + conquistas de um aluno específico. Algumas são automáticas (nota máxima, pontualidade, presença exemplar).
- **Link público do aluno**: em Turmas, botão "Copiar link público" de cada turma — abra em uma aba anônima (sem login) e veja o pódio da turma.

## Se der erro

Tira um print da tela (e se puder, abra o console do navegador com F12 → aba "Console" e tira print também) e me manda aqui que eu corrijo.

## Variáveis de ambiente no Vercel (caso precise checar)

```
VITE_SUPABASE_URL=https://jrymjuplubalpvlqmpzr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ZkJDIMm94qcyQ1PjWDxj7A_M4D4uHBk
```
