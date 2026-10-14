# ClassRank — Design Spec

Data: 2026-10-14

## Visão geral

SPA Vue 3 para o professor gerenciar turmas, tarefas do CMSP, notas e um
ranking gamificado (tema pixel art / plataforma 2D) com pódium Top 3,
conquistas automáticas e missão semanal por turma. Dados persistidos em
Supabase (Postgres + Storage). Login exclusivo do professor (gerencia
turmas/notas); alunos acessam o ranking da própria turma sem cadastro,
por um link público. Hospedado na Vercel.

## Escopo funcional

1. **Turmas, matérias, alunos** — CRUD básico, foto do aluno via upload
   (Supabase Storage, bucket `avatars`).
2. **Tarefas CMSP** — cadastradas por matéria+turma (título, link/ID CMSP,
   data de entrega, nota máxima). Nota de cada aluno por tarefa lançada
   manualmente ou importada de CSV/Excel (relatório baixado do CMSP pelo
   professor).
3. **Avaliações** — Prova 1, Prova 2, Participação (0–10) por aluno e
   matéria, editáveis numa tabela inline ("Área do Professor").
4. **Nota final e ranking** — nota final = média(nota das tarefas da
   matéria) + Prova1 + Prova2 + Participação, todas 0–10, média simples
   das 4 categorias. Ranking ordenado desc, recalculado automaticamente.
   Pódium visual para Top 3 (ouro/prata/bronze) com foto do aluno e coroa.
5. **Conquistas (badges)** — catálogo fixo de regras simples avaliadas
   automaticamente a cada atualização de nota (ex.: "Pontual" = entregou
   todas as tarefas da matéria antes do prazo; "Nota Máxima" = nota final
   ≥ 9; "Presença Exemplar" = participação ≥ 9 em todas as matérias).
   Conquistas desbloqueadas ficam salvas por aluno; a Home mostra a mais
   recente desbloqueada na turma.
6. **Missão da semana** — definida manualmente pelo professor por turma
   (título, descrição, meta numérica, progresso atual); exibida com barra
   de progresso. Sem motor de regras automático nesta v1 (YAGNI) — o
   professor atualiza o progresso manualmente.
7. **Importação de relatório CMSP** — modal para subir CSV/XLSX e mapear
   colunas (nome do aluno → nota) para uma tarefa específica.
8. **Export/Import JSON** — backup manual do estado (fallback local, além
   do banco online).
9. **Login do professor** — tela única de autenticação (Supabase Auth,
   email/senha); protege `/`, `/ranking`, `/conquistas` e `/turmas`
   (visão multi-turma e gestão). `/login` e `/sobre` são públicas.
10. **Acesso público do aluno por turma** — cada turma tem um `slug`
    único gerado automaticamente. `/t/:slug` é uma rota pública (sem
    login) que mostra só a turma daquele link: pódium, ranking,
    conquistas e missão da semana (somente leitura — sem os controles
    de edição do professor). O professor copia esse link na área
    `/turmas` e compartilha com a turma. Acesso público não navega
    entre turmas nem lista outras turmas.
11. **Testes de erro** — toda operação que pode falhar (chamada ao
    Supabase, parsing de arquivo, formulário) tem teste cobrindo o
    caminho de erro, e a UI correspondente mostra uma mensagem de erro
    em vez de quebrar.

## Navegação (Vue Router)

- `/login` — pública
- `/t/:slug` — pública, somente leitura, escopada a uma única turma
- `/` — protegida: banner de troféu, pódium Top 3 da turma/matéria
  selecionada (entre todas as turmas), card "Missão da semana", card
  "Conquista recente"
- `/ranking` — protegida: tabela completa de ranking com filtros de
  turma/matéria
- `/conquistas` — protegida: catálogo de conquistas + quadro de quem
  desbloqueou o quê
- `/turmas` — protegida: área do professor — CRUD de
  turmas/alunos/matérias/tarefas, tabela editável de notas, importação
  CSV/XLSX, link público de cada turma
- `/sobre` — pública, página estática

## Arquitetura e padrões de projeto

```
src/
  repositories/      # Repository Pattern — único ponto de contato com Supabase
    turmasRepository.js
    materiasRepository.js
    alunosRepository.js
    tarefasRepository.js
    avaliacoesRepository.js
    conquistasRepository.js
    missoesRepository.js
    storageRepository.js   # upload/URL de fotos no bucket avatars
    publicRepository.js    # chamadas RPC usadas pela rota pública /t/:slug
  domain/
    NotaFinalCalculator.js # Strategy — fórmula da nota final
    conquistaRules/        # Strategy — uma classe/função por regra de conquista
      pontualRule.js
      notaMaximaRule.js
      presencaExemplarRule.js
    ConquistaEngine.js      # roda as regras cadastradas contra um aluno
    importParsers/          # Factory — CsvParser / XlsxParser, interface comum
      ImportParserFactory.js
      CsvParser.js
      XlsxParser.js
  stores/            # Pinia — fachada reativa sobre os repositories
    auth.js turmas.js materias.js alunos.js tarefas.js avaliacoes.js
    conquistas.js missoes.js
  composables/
    useRanking.js      # ordena alunos por nota final, calcula posição
    useImportCmsp.js    # fluxo do modal de importação
  components/
    layout/ TopNav.vue AppBackground.vue (cenário pixel art SVG/CSS)
    ranking/ PodiumTop3.vue RankingTable.vue
    gamification/ MissaoSemanalCard.vue ConquistaRecenteCard.vue
                  ConquistaBadge.vue
    professor/ EditableGradesTable.vue TaskModal.vue StudentModal.vue
               ImportCmspModal.vue TurmaMateriaForm.vue
    shared/ ExportImportJson.vue PixelButton.vue PixelCard.vue
  views/ HomeView.vue RankingView.vue ConquistasView.vue TurmasView.vue
         SobreView.vue LoginView.vue PublicTurmaView.vue
  router/index.js
```

- **Repository Pattern**: nenhuma store ou componente importa o client do
  Supabase diretamente; tudo passa pelos repositories.
- **Strategy Pattern**: `NotaFinalCalculator` e as `conquistaRules`
  isolam fórmulas/regras que podem mudar sem tocar no resto do app.
- **Factory Pattern**: `ImportParserFactory.create(file)` devolve o parser
  certo (CSV ou XLSX) atrás de uma interface `parse(file): RowsDTO[]`.
- **Composables + Pinia**: lógica reativa fica em composables; estado
  compartilhado entre telas fica nas stores, que chamam os repositories.

## Modelo de dados (Supabase/Postgres)

```
turmas(id, nome, slug unique, created_at)
materias(id, nome, created_at)
alunos(id, turma_id fk, nome, foto_url, created_at)
tarefas(id, turma_id fk, materia_id fk, titulo, cmsp_link, data_entrega, nota_maxima, created_at)
notas_tarefas(id, aluno_id fk, tarefa_id fk, nota, entregue_em)
avaliacoes(id, aluno_id fk, materia_id fk, prova1, prova2, participacao)
conquistas(id, codigo, nome, descricao, icone)                -- catálogo fixo
aluno_conquistas(id, aluno_id fk, conquista_id fk, data_conquistada)
missoes_semanais(id, turma_id fk, titulo, descricao, meta, progresso_atual, semana_referencia)
```

`turmas.slug` é gerado automaticamente (texto aleatório curto, único) na
criação da turma — é o token do link público `/t/:slug`.

**RLS e acesso público**: todas as 9 tabelas têm RLS habilitado e só
permitem `authenticated` (o professor). O papel `anon` **não** tem acesso
direto a nenhuma tabela — mesmo que alguém tente consultar a API REST do
Supabase diretamente, não há como listar turmas, alunos ou notas de
outras turmas. O acesso público da rota `/t/:slug` passa exclusivamente
por funções Postgres `SECURITY DEFINER` (RPC), cada uma recebendo o
`slug` como parâmetro e devolvendo só os dados daquela turma:
`rpc_turma_publica(slug)`, `rpc_ranking_publico(slug, materia_id)`,
`rpc_conquistas_publicas(slug)`, `rpc_missao_publica(slug)`. O papel
`anon` recebe `GRANT EXECUTE` só nessas funções, nunca `SELECT` nas
tabelas. Bucket `avatars`: leitura pública (fotos precisam aparecer na
rota pública), escrita só `authenticated`.

## Tema visual — Retro Arcade 2D

- Fontes via Google Fonts: "Press Start 2P" (títulos/placar) e "VT323"
  (corpo/tabelas).
- Fundo de cenário original em SVG/CSS (céu, nuvens, colinas, árvores,
  silhueta de castelo) em `AppBackground.vue` — estilo pixel art próprio,
  não uma cópia da imagem de referência.
- Cards estilo "placa de madeira" com borda em degraus (box-shadow),
  sem gradiente/blur real — sombra sólida deslocada simulando 8-bit.
- Pódium: blocos ouro/prata/bronze, moldura pixelada pra foto do aluno,
  coroa no 1º lugar.
- Botões com efeito "pressionar" (translateY + sombra sólida ao `:active`).
- Paleta: navy/roxo escuro de fundo, acentos neon ciano/magenta/dourado.

## Deploy

Vercel, projeto único (SPA Vue): rewrite catch-all para `index.html`
(client-side routing do vue-router), env vars `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` configuradas no projeto Vercel. A separação
pública/professor é feita pelo app (guard de rotas + RLS/RPC), não pela
hospedagem — um projeto Vercel só atende as duas áreas.

## Fora de escopo (v1)

- Login de alunos (acessam só pelo link público da turma, sem conta).
- Motor automático de progresso da missão semanal (é manual).
- Histórico/snapshot semanal do ranking (ranking é sempre o atual).
- Scraping/integração automática com CMSP (exige login institucional).
- Revogar/regenerar o `slug` de uma turma (se vazar, é fora de escopo
  nesta v1 — o professor recria a turma se precisar).
