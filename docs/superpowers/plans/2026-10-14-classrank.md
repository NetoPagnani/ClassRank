# ClassRank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ClassRank, a Vue 3 SPA where a teacher manages turmas/matérias/alunos/tarefas CMSP, grades, a gamified pixel-art ranking with Top-3 podium, automatic achievements, and a manual weekly mission, backed by Supabase (Postgres + Storage + Auth).

**Architecture:** Layered front-end — `repositories/` is the only layer that talks to Supabase (Repository Pattern); `domain/` holds pure, swappable business rules (Strategy: `NotaFinalCalculator`, `conquistaRules`; Factory: `ImportParserFactory`); Pinia `stores/` are a reactive façade over repositories + domain; `composables/` hold cross-component reactive logic; `components/`+`views/` are presentation only.

**Tech Stack:** Vue 3 (`<script setup>`) + Vite + vue-router + Pinia + Tailwind CSS v3, `@supabase/supabase-js` v2, `exceljs` for XLSX import (not `xlsx`/SheetJS — `npm audit` flags it high-severity prototype pollution/ReDoS with no fix available, and the app parses teacher-uploaded files as a runtime dependency, not just a dev tool, so `exceljs` is used instead), Vitest + @vue/test-utils for tests, Google Fonts (Press Start 2P, VT323).

**Spec:** [docs/specs/2026-10-14-classrank-design.md](../../specs/2026-10-14-classrank-design.md)

## Global Constraints

- Vue 3 Composition API with `<script setup>` only — no Options API.
- Nota final = média simples de 4 categorias (0–10 cada): média das tarefas, Prova 1, Prova 2, Participação.
- Nenhuma store ou componente importa `@supabase/supabase-js` diretamente — só `repositories/` e `repositories/supabaseClient.js`.
- Login é exclusivo do professor. Rotas `/`, `/ranking`, `/conquistas`, `/turmas` exigem `authStore.user`; `/login`, `/sobre`, `/t/:slug` são públicas.
- RLS: as 9 tabelas base permitem só `authenticated` (nenhum `select`/`insert`/`update`/`delete` direto para `anon`). O acesso público (`/t/:slug`) passa exclusivamente pelas funções `SECURITY DEFINER` criadas na Task 2 (`rpc_turma_publica`, `rpc_ranking_publico`, `rpc_conquistas_publicas`, `rpc_missao_publica`), chamadas via `supabase.rpc(...)` em `src/repositories/publicRepository.js` — nunca via `.from(...)`. Bucket `avatars`: leitura pública, escrita só `authenticated`.
- Toda operação que pode falhar (chamada Supabase/RPC, parsing de arquivo, formulário) precisa de teste cobrindo o caminho de erro: repository testado propagando o erro do Supabase; store/composable testado deixando um estado de erro legível (`error` ref) em vez de rejeitar sem tratamento; componente/view testado renderizando uma mensagem de erro em vez de quebrar.
- Missão semanal: progresso é digitado manualmente pelo professor, sem motor de regras automático (fora de escopo v1).
- Conquistas são avaliadas automaticamente pelo `ConquistaEngine` toda vez que notas de um aluno são salvas.
- Tema visual: fundo/scoreboard em SVG/CSS original (não copiar a imagem de referência pixel a pixel).
- Deploy: Vercel, projeto único, rewrite catch-all para `index.html`, env vars `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` no projeto Vercel (Task 24).

## Review Focus

- Tarefa com `nota_maxima` ≠ 10 — a nota lançada deve ser normalizada para escala 0–10 antes de entrar na média de tarefas (ex.: tarefa vale 5, aluno tira 4 → 8.0). Testado no Task 8.
- Aluno sem nenhuma tarefa lançada na matéria — a média de tarefas não pode gerar `NaN`/divisão por zero; deve tratar como 0. Testado no Task 8.
- Importação CSV/XLSX com nome de aluno que não bate exatamente com o cadastrado (acento/espaço/maiúscula) — deve normalizar a comparação e reportar "aluno não encontrado" em vez de falhar silenciosamente ou gravar nota errada. Testado no Task 10.
- Regra de conquista "Pontual" com nota lançada depois do prazo da tarefa — não pode contar como pontual mesmo se a nota for alta. Testado no Task 9.
- Aluno sem `foto_url` (upload nunca feito ou falhou) — pódium e avatar devem cair num fallback visual em vez de quebrar o layout. Testado no Task 17.
- `/t/:slug` com slug inexistente — a RPC pública devolve vazio/null, não erro de servidor, e `PublicTurmaView` mostra "turma não encontrada" em vez de tela quebrada. Testado no Task 18.
- Qualquer chamada de repository rejeitada (erro de rede/Supabase) propagando até a store sem handler — store deve capturar e expor em `error`, nunca deixar a promise rejeitada sem tratamento no componente. Testado nas Tasks 12–14 e 20–22.

---

## Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.js`, `src/App.vue`, `.env.example`, `.gitignore`

**Interfaces:**
- Produces: a runnable `npm run dev` Vite app and `npm run test` Vitest runner that later tasks build into.

- [ ] **Step 1: Scaffold the project**

Run `npm create vite@latest . -- --template vue` (accept merging into the current empty-ish dir), then `npm install vue-router@4 pinia @supabase/supabase-js exceljs` and `npm install -D tailwindcss@^3 postcss autoprefixer vitest @vue/test-utils jsdom` (pin `tailwindcss@^3` — v4 removed `npx tailwindcss init`, which Step 2 needs).

- [ ] **Step 2: Configure Tailwind**

`npx tailwindcss init -p`; set `content: ["./index.html", "./src/**/*.{vue,js}"]` in `tailwind.config.js`; add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/style.css`, imported from `main.js`.

- [ ] **Step 3: Add Google Fonts and base pixel theme variables**

In `index.html` `<head>`, add `<link>` tags for Google Fonts "Press Start 2P" and "VT323". In `tailwind.config.js` `theme.extend.fontFamily`, register `pixel: ['"Press Start 2P"', 'cursive']` and `retro: ['"VT323"', 'monospace']`.

- [ ] **Step 4: Configure Vitest**

`vitest.config.js` with `test: { environment: 'jsdom', globals: true }`. Add `"test": "vitest run"` to `package.json` scripts.

- [ ] **Step 5: Write and run a smoke test**

`src/__tests__/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest'
describe('smoke', () => { it('runs', () => expect(1 + 1).toBe(2)) })
```
Run: `npm run test` — Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold ClassRank project"
```

---

## Task 2: Supabase schema, RLS & public RPC access

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_public_rpc.sql`, `src/repositories/publicRepository.js`
- Test: `src/repositories/__tests__/publicRepository.test.js`

**Interfaces:**
- Produces: tables `turmas (with unique slug), materias, alunos, tarefas, notas_tarefas, avaliacoes, conquistas, aluno_conquistas, missoes_semanais` in project `jrymjuplubalpvlqmpzr`, all RLS-protected to `authenticated` only (no `anon` table grants); storage bucket `avatars` (public read, authenticated write); 4 `SECURITY DEFINER` RPC functions grantable to `anon`; `publicRepository.js` exporting `{ getTurmaBySlug(slug), getRankingPublico(slug, materiaId), getConquistasPublicas(slug), getMissaoPublica(slug) }`, each a thin wrapper around `supabase.rpc(...)`, consumed by Task 18's `PublicTurmaView.vue`.

- [ ] **Step 1: Write the base migration SQL** in `supabase/migrations/0001_init.sql` with the 9 tables from the spec's "Modelo de dados" section (exact columns/FKs as listed there, including `turmas.slug text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 10)`), `enable row level security` on every table, and one policy per table: `for all to authenticated using (true) with check (true)`. No policy grants anything to `anon`.

- [ ] **Step 2: Write the public RPC migration** in `supabase/migrations/0002_public_rpc.sql`:
  - `rpc_turma_publica(p_slug text) returns table(id uuid, nome text)` — selects from `turmas` where `slug = p_slug`.
  - `rpc_ranking_publico(p_slug text, p_materia_id uuid) returns table(aluno_id uuid, nome text, foto_url text, nota_final numeric)` — joins `turmas`→`alunos`→`avaliacoes`/`notas_tarefas`/`tarefas` filtered to the matching turma and matéria, computing the same formula as `NotaFinalCalculator` (média das tarefas normalizadas 0–10 + prova1 + prova2 + participação, média simples) directly in SQL.
  - `rpc_conquistas_publicas(p_slug text) returns table(aluno_nome text, conquista_nome text, conquista_icone text, data_conquistada timestamptz)` — joins `turmas`→`alunos`→`aluno_conquistas`→`conquistas`.
  - `rpc_missao_publica(p_slug text) returns table(titulo text, descricao text, meta numeric, progresso_atual numeric)` — from `missoes_semanais` joined to the matching turma.
  All four: `language sql security definer set search_path = public`, each filtering strictly by the turma matching `p_slug` (no function returns rows across turmas). Then `grant execute on function rpc_turma_publica, rpc_ranking_publico, rpc_conquistas_publicas, rpc_missao_publica to anon` and confirm no other `grant ... to anon` exists anywhere in either migration file.

- [ ] **Step 3: Apply both migrations**

Use the Supabase MCP `apply_migration` tool against project id `jrymjuplubalpvlqmpzr`, Step 1's SQL then Step 2's SQL, in order.

- [ ] **Step 4: Create the `avatars` storage bucket**

Use `execute_sql` (or the dashboard if the MCP tools don't expose storage bucket creation) to create a public bucket named `avatars`; add a storage policy allowing `authenticated` inserts and public `select`.

- [ ] **Step 5: Verify schema and access**

Run `list_tables` on project `jrymjuplubalpvlqmpzr` — Expected: all 9 tables listed with RLS enabled. Run `get_advisors` (security) — Expected: no "RLS disabled" warnings. Run `execute_sql` with `select has_table_privilege('anon', 'turmas', 'SELECT')` (and the same for `alunos`, `avaliacoes`) — Expected: `false` for all three, confirming `anon` has no direct table access. Run `execute_sql` calling `select * from rpc_turma_publica('does-not-exist')` — Expected: empty result, not an error (confirms the "slug não encontrado" path is a clean empty set, not an exception, for Task 18's Review Focus item).

- [ ] **Step 6: Write failing tests for `publicRepository.js`** — mock `supabase.rpc('rpc_turma_publica', { p_slug: 'abc' })` to resolve `{ data: [{id:'1', nome:'3º Ano TI'}], error: null }`; assert `getTurmaBySlug('abc')` resolves to that row (or `null` when `data` is empty — covers the "slug não encontrado" path). Repeat the pattern (resolve + empty-result case) for the other three methods.

- [ ] **Step 7: Run tests to verify they fail, implement `publicRepository.js`, run again to verify they pass.**

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/0001_init.sql supabase/migrations/0002_public_rpc.sql src/repositories/publicRepository.js src/repositories/__tests__/publicRepository.test.js
git commit -m "feat: add Supabase schema, RLS and public RPC access"
```

---

## Task 3: Supabase client + env config

**Files:**
- Create: `src/repositories/supabaseClient.js`, `.env.local` (not committed)
- Modify: `.env.example`

**Interfaces:**
- Produces: `export const supabase` (a configured `SupabaseClient`) from `src/repositories/supabaseClient.js`, used by every repository in Tasks 4–7.

- [ ] **Step 1: Fetch project URL and anon key**

Use the Supabase MCP `get_project_url` and `get_publishable_keys` tools for project `jrymjuplubalpvlqmpzr`.

- [ ] **Step 2: Write `.env.local`** with `VITE_SUPABASE_URL=<url>` and `VITE_SUPABASE_ANON_KEY=<key>`; add the same keys with empty values to `.env.example`. Confirm `.env.local` is listed in `.gitignore`.

- [ ] **Step 3: Implement `supabaseClient.js`**

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
```

- [ ] **Step 4: Verify the dev server boots without env errors**

Run: `npm run dev` (start, check no console error about missing env vars, then stop it).

- [ ] **Step 5: Commit**

```bash
git add .env.example src/repositories/supabaseClient.js
git commit -m "feat: configure Supabase client"
```

---

## Task 4: Repository layer — turmas & materias

**Files:**
- Create: `src/repositories/turmasRepository.js`, `src/repositories/materiasRepository.js`
- Test: `src/repositories/__tests__/turmasRepository.test.js`, `src/repositories/__tests__/materiasRepository.test.js`

**Interfaces:**
- Consumes: `supabase` from `src/repositories/supabaseClient.js` (Task 3).
- Produces: `turmasRepository = { list(), create(nome), remove(id) }` returning `{id, nome, created_at}[]`/row; `materiasRepository` with the same shape for `materias`.

- [ ] **Step 1: Write the failing test for `turmasRepository.list()`**, mocking `supabase.from('turmas').select()` with `vi.mock('../supabaseClient.js', ...)` to resolve `{ data: [{id: '1', nome: '3º Ano TI'}], error: null }`; assert `await turmasRepository.list()` returns that array.

- [ ] **Step 2: Run test to verify it fails** — Run: `npm run test -- turmasRepository` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `turmasRepository.js`** with `list()`, `create(nome)`, `remove(id)` wrapping `supabase.from('turmas')`; throw the Supabase `error` if present.

- [ ] **Step 4: Run test to verify it passes** — Expected: PASS.

- [ ] **Step 5: Repeat Steps 1–4 for `materiasRepository.js`** (table `materias`, same shape).

- [ ] **Step 6: Commit**

```bash
git add src/repositories/turmasRepository.js src/repositories/materiasRepository.js src/repositories/__tests__
git commit -m "feat: add turmas and materias repositories"
```

---

## Task 5: Repository layer — alunos & storage

**Files:**
- Create: `src/repositories/alunosRepository.js`, `src/repositories/storageRepository.js`
- Test: `src/repositories/__tests__/alunosRepository.test.js`, `src/repositories/__tests__/storageRepository.test.js`

**Interfaces:**
- Consumes: `supabase` (Task 3).
- Produces: `alunosRepository = { listByTurma(turmaId), create({turmaId, nome, fotoUrl}), update(id, patch), remove(id) }`; `storageRepository = { uploadAvatar(alunoId, file): Promise<string /* public URL */> }`.

- [ ] **Step 1: Write the failing test for `alunosRepository.listByTurma(turmaId)`** — mock `.from('alunos').select().eq('turma_id', turmaId)` to resolve `{data: [{id:'1', turma_id: 't1', nome:'Ana', foto_url: null}], error: null}`; assert the returned array.

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `alunosRepository.js`** with `listByTurma`, `create`, `update`, `remove`.

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Write the failing test for `storageRepository.uploadAvatar(alunoId, file)`** — mock `supabase.storage.from('avatars').upload(...)` to resolve `{data: {path: 'aluno-1.png'}, error: null}` and `.getPublicUrl(...)` to return `{data: {publicUrl: 'https://.../aluno-1.png'}}`; assert the function resolves to that URL string.

- [ ] **Step 6: Run test to verify it fails, then implement `storageRepository.js`**, then run again to verify it passes.

- [ ] **Step 7: Commit**

```bash
git add src/repositories/alunosRepository.js src/repositories/storageRepository.js src/repositories/__tests__
git commit -m "feat: add alunos and storage repositories"
```

---

## Task 6: Repository layer — tarefas & avaliações

**Files:**
- Create: `src/repositories/tarefasRepository.js`, `src/repositories/avaliacoesRepository.js`
- Test: `src/repositories/__tests__/tarefasRepository.test.js`, `src/repositories/__tests__/avaliacoesRepository.test.js`

**Interfaces:**
- Consumes: `supabase` (Task 3).
- Produces:
  - `tarefasRepository = { listByTurmaMateria(turmaId, materiaId), create({turmaId, materiaId, titulo, cmspLink, dataEntrega, notaMaxima}), remove(id), saveNota(alunoId, tarefaId, nota, entregueEm) }` — `saveNota` upserts into `notas_tarefas`.
  - `avaliacoesRepository = { getByAlunoMateria(alunoId, materiaId), upsert({alunoId, materiaId, prova1, prova2, participacao}) }`.

- [ ] **Step 1: Write failing tests for `tarefasRepository.listByTurmaMateria` and `.saveNota`** (mock `.from('tarefas')` / `.from('notas_tarefas').upsert(...)`).

- [ ] **Step 2: Run tests to verify they fail.**

- [ ] **Step 3: Implement `tarefasRepository.js`.**

- [ ] **Step 4: Run tests to verify they pass.**

- [ ] **Step 5: Write failing tests for `avaliacoesRepository.getByAlunoMateria` and `.upsert`** (mock `.from('avaliacoes')`).

- [ ] **Step 6: Run tests to verify they fail, implement `avaliacoesRepository.js`, run again to verify they pass.**

- [ ] **Step 7: Commit**

```bash
git add src/repositories/tarefasRepository.js src/repositories/avaliacoesRepository.js src/repositories/__tests__
git commit -m "feat: add tarefas and avaliacoes repositories"
```

---

## Task 7: Repository layer — conquistas & missões

**Files:**
- Create: `src/repositories/conquistasRepository.js`, `src/repositories/missoesRepository.js`
- Test: `src/repositories/__tests__/conquistasRepository.test.js`, `src/repositories/__tests__/missoesRepository.test.js`

**Interfaces:**
- Consumes: `supabase` (Task 3).
- Produces:
  - `conquistasRepository = { listCatalogo(), listByAluno(alunoId), unlock(alunoId, conquistaCodigo) }` — `listCatalogo()` reads `conquistas`; `listByAluno` joins `aluno_conquistas`→`conquistas`; `unlock` inserts into `aluno_conquistas` if not already present (idempotent).
  - `missoesRepository = { getByTurma(turmaId), upsert({turmaId, titulo, descricao, meta, progressoAtual, semanaReferencia}) }`.

- [ ] **Step 1: Write failing tests for `conquistasRepository.listCatalogo`, `.listByAluno`, `.unlock` (including the idempotent-insert case: second `unlock` call for the same aluno+conquista does not insert a duplicate — assert the mocked insert is called with `onConflict`/checked-first logic you choose).**

- [ ] **Step 2: Run tests to verify they fail.**

- [ ] **Step 3: Implement `conquistasRepository.js`.**

- [ ] **Step 4: Run tests to verify they pass.**

- [ ] **Step 5: Write failing tests for `missoesRepository.getByTurma` and `.upsert`, then implement `missoesRepository.js`, then verify they pass.**

- [ ] **Step 6: Commit**

```bash
git add src/repositories/conquistasRepository.js src/repositories/missoesRepository.js src/repositories/__tests__
git commit -m "feat: add conquistas and missoes repositories"
```

---

## Task 8: Domain — NotaFinalCalculator (Strategy)

**Files:**
- Create: `src/domain/NotaFinalCalculator.js`
- Test: `src/domain/__tests__/NotaFinalCalculator.test.js`

**Interfaces:**
- Produces: `calcularMediaTarefas(tarefas: {nota: number, notaMaxima: number}[]): number` (0–10 scale) and `calcularNotaFinal({ mediaTarefas, prova1, prova2, participacao }): number`, both exported from `NotaFinalCalculator.js`.

- [ ] **Step 1: Write failing tests**

```js
import { calcularMediaTarefas, calcularNotaFinal } from '../NotaFinalCalculator.js'

test('normaliza nota de tarefa para escala 0-10', () => {
  expect(calcularMediaTarefas([{ nota: 4, notaMaxima: 5 }])).toBe(8)
})
test('retorna 0 quando não há tarefas lançadas', () => {
  expect(calcularMediaTarefas([])).toBe(0)
})
test('nota final é a média simples das 4 categorias', () => {
  expect(calcularNotaFinal({ mediaTarefas: 8, prova1: 6, prova2: 10, participacao: 8 })).toBe(8)
})
```

- [ ] **Step 2: Run tests to verify they fail** — Run: `npm run test -- NotaFinalCalculator` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `NotaFinalCalculator.js`**

`calcularMediaTarefas` maps each tarefa's `nota / notaMaxima * 10`, averages them (0 when the array is empty — guard the division). `calcularNotaFinal` averages the four 0–10 inputs.

- [ ] **Step 4: Run tests to verify they pass.**

- [ ] **Step 5: Commit**

```bash
git add src/domain/NotaFinalCalculator.js src/domain/__tests__/NotaFinalCalculator.test.js
git commit -m "feat: add NotaFinalCalculator strategy"
```

---

## Task 9: Domain — conquistaRules + ConquistaEngine (Strategy)

**Files:**
- Create: `src/domain/conquistaRules/pontualRule.js`, `src/domain/conquistaRules/notaMaximaRule.js`, `src/domain/conquistaRules/presencaExemplarRule.js`, `src/domain/ConquistaEngine.js`
- Test: `src/domain/__tests__/conquistaRules.test.js`, `src/domain/__tests__/ConquistaEngine.test.js`

**Interfaces:**
- Consumes: `calcularNotaFinal` is not needed here — rules receive pre-computed aluno data (see below).
- Produces: each rule file exports `{ codigo: string, avaliar(alunoContexto): boolean }`, where `alunoContexto = { tarefasEntregues: {nota, notaMaxima, dataEntrega: Date, prazo: Date}[], notaFinal: number, participacaoPorMateria: number[] }`. `ConquistaEngine.js` exports `avaliarConquistas(alunoContexto, regras = [pontualRule, notaMaximaRule, presencaExemplarRule]): string[]` (codigos desbloqueados).

- [ ] **Step 1: Write failing tests for each rule**

```js
test('pontualRule: true quando todas as tarefas entregues até o prazo', () => {
  expect(pontualRule.avaliar({ tarefasEntregues: [{ dataEntrega: new Date('2026-10-01'), prazo: new Date('2026-10-05') }] }).toBe(true)
})
test('pontualRule: false quando alguma tarefa entregue após o prazo', () => {
  expect(pontualRule.avaliar({ tarefasEntregues: [{ dataEntrega: new Date('2026-10-06'), prazo: new Date('2026-10-05') }] })).toBe(false)
})
test('notaMaximaRule: true quando notaFinal >= 9', () => { ... })
test('presencaExemplarRule: true quando toda participacaoPorMateria >= 9', () => { ... })
```

- [ ] **Step 2: Run tests to verify they fail.**

- [ ] **Step 3: Implement the three rule files** (exact codes: `'pontual'`, `'nota_maxima'`, `'presenca_exemplar'`).

- [ ] **Step 4: Run tests to verify they pass.**

- [ ] **Step 5: Write failing test for `ConquistaEngine.avaliarConquistas`** — given an `alunoContexto` that satisfies `pontualRule` and `notaMaximaRule` but not `presencaExemplarRule`, assert the returned array is `['pontual', 'nota_maxima']`.

- [ ] **Step 6: Run test to verify it fails, implement `ConquistaEngine.js`** (iterates the rules array, collects `codigo` where `avaliar` returns true), **run again to verify it passes.**

- [ ] **Step 7: Commit**

```bash
git add src/domain/conquistaRules src/domain/ConquistaEngine.js src/domain/__tests__
git commit -m "feat: add conquista rules and engine"
```

---

## Task 10: Domain — ImportParserFactory (Factory)

**Files:**
- Create: `src/domain/importParsers/ImportParserFactory.js`, `src/domain/importParsers/CsvParser.js`, `src/domain/importParsers/XlsxParser.js`, `src/domain/importParsers/normalizeName.js`
- Test: `src/domain/__tests__/importParsers.test.js`

**Interfaces:**
- Produces: `normalizeName(name: string): string` (lowercase, trim, strip accents); both parsers implement `parse(file: File): Promise<{nome: string, nota: number}[]>`; `ImportParserFactory.create(file: File)` returns the `CsvParser` instance for `.csv` files and `XlsxParser` for `.xlsx`/`.xls`, throwing for any other extension.

- [ ] **Step 1: Write failing tests**

```js
test('normalizeName remove acento, espaços extras e caixa', () => {
  expect(normalizeName('  João  Pedro ')).toBe('joao pedro')
})
test('ImportParserFactory.create escolhe CsvParser para .csv', () => {
  expect(ImportParserFactory.create(new File([''], 'x.csv'))).toBeInstanceOf(CsvParser)
})
test('ImportParserFactory.create lança erro para extensão desconhecida', () => {
  expect(() => ImportParserFactory.create(new File([''], 'x.pdf'))).toThrow()
})
test('CsvParser.parse mapeia linhas "nome,nota" para objetos', async () => {
  const file = new File(['nome,nota\nAna,8.5\n'], 'x.csv', { type: 'text/csv' })
  await expect(new CsvParser().parse(file)).resolves.toEqual([{ nome: 'Ana', nota: 8.5 }])
})
```

- [ ] **Step 2: Run tests to verify they fail.**

- [ ] **Step 3: Implement `normalizeName.js`, `CsvParser.js`** (split lines, skip header, split by comma), **`XlsxParser.js`** (use `exceljs`'s `Workbook.xlsx.load(await file.arrayBuffer())`, read the first worksheet, map rows after the header row to `{nome, nota}` by column position — columns `nome`/`nota`), **and `ImportParserFactory.js`.**

- [ ] **Step 4: Run tests to verify they pass.**

- [ ] **Step 5: Commit**

```bash
git add src/domain/importParsers src/domain/__tests__/importParsers.test.js
git commit -m "feat: add CSV/XLSX import parser factory"
```

---

## Task 11: Auth store, router guard, LoginView

**Files:**
- Create: `src/stores/auth.js`, `src/router/index.js`, `src/views/LoginView.vue`
- Modify: `src/main.js`, `src/App.vue`
- Test: `src/stores/__tests__/auth.test.js`

**Interfaces:**
- Consumes: `supabase` (Task 3).
- Produces: `useAuthStore()` with state `{ user, loading, error }`, actions `signIn(email, password)` (sets `error` instead of throwing when `supabase.auth.signInWithPassword` rejects/returns an error), `signOut()`, `restoreSession()`; router with public routes `/login`, `/sobre`, `/t/:slug` and protected routes `/`, `/ranking`, `/conquistas`, `/turmas` requiring `authStore.user` via `router.beforeEach`, redirecting protected-route access to `/login` when absent.

- [ ] **Step 1: Write failing tests for `auth.js`**

Using `@pinia/testing` or a manual `setActivePinia(createPinia())`, mock `supabase.auth.signInWithPassword` to resolve `{ data: { user: { id: '1' } }, error: null }`; assert `store.signIn('a@a.com','x')` sets `store.user` to that user. Add a second test mocking it to resolve `{ data: { user: null }, error: { message: 'Invalid login credentials' } }`; assert `store.error` is set to that message and `store.user` stays `null` (no throw).

- [ ] **Step 2: Run tests to verify they fail.**

- [ ] **Step 3: Implement `auth.js`** (Pinia `defineStore('auth', ...)` with the actions above, wrapping `supabase.auth`).

- [ ] **Step 4: Run tests to verify they pass.**

- [ ] **Step 5: Implement `router/index.js`** with `createRouter`/`createWebHistory`, routes for `/login`, `/sobre` (public), `/t/:slug` (public — component wired in Task 18), `/`, `/ranking`, `/conquistas`, `/turmas` (protected; components wired to stub views where not yet built — later tasks fill them in), and the `beforeEach` guard: only the protected group redirects to `/login` when `authStore.user` is absent.

- [ ] **Step 6: Implement `LoginView.vue`** — email/password form calling `authStore.signIn`, shows `authStore.error` inline instead of crashing on bad credentials.

- [ ] **Step 7: Wire `main.js`** to install Pinia and the router before mount; `App.vue` becomes `<RouterView />` (layout added in Task 16).

- [ ] **Step 8: Manual check** — Run `npm run dev`, confirm navigating to `/` redirects to `/login` when logged out.

- [ ] **Step 9: Commit**

```bash
git add src/stores/auth.js src/router src/views/LoginView.vue src/main.js src/App.vue src/stores/__tests__
git commit -m "feat: add auth store, router guard and login view"
```

---

## Task 12: Pinia stores — turmas, materias, alunos

**Files:**
- Create: `src/stores/turmas.js`, `src/stores/materias.js`, `src/stores/alunos.js`
- Test: `src/stores/__tests__/turmas.test.js`, `src/stores/__tests__/materias.test.js`, `src/stores/__tests__/alunos.test.js`

**Interfaces:**
- Consumes: `turmasRepository`, `materiasRepository`, `alunosRepository`, `storageRepository` (Tasks 4–5).
- Produces: `useTurmasStore()` → `{ items: Ref<Turma[]>, selectedId: Ref<string|null>, error: Ref<string|null>, fetchAll(), add(nome) }`; `useMateriasStore()` same shape for materias; `useAlunosStore()` → `{ itemsByTurma: Ref<Record<turmaId, Aluno[]>>, error: Ref<string|null>, fetchByTurma(turmaId), add({turmaId, nome}), uploadFoto(alunoId, file) }`. Every `fetch*`/`add`/`upload*` action catches a rejected repository call and sets `error` to its message instead of leaving the promise unhandled; each store's test suite includes one case asserting this (reject the mocked repository call, assert `error` is set and the store doesn't throw).

- [ ] **Step 1: Write failing test for `turmas.js`** — mock `turmasRepository.list` to resolve a fixture array; assert `store.fetchAll()` populates `store.items`.

- [ ] **Step 2: Run test to verify it fails, implement `turmas.js`, run again to verify it passes.**

- [ ] **Step 3: Repeat Steps 1–2 for `materias.js`.**

- [ ] **Step 4: Write failing test for `alunos.js`** covering `fetchByTurma` populating `itemsByTurma[turmaId]`, and `uploadFoto` calling `storageRepository.uploadAvatar` then `alunosRepository.update(id, { fotoUrl })`.

- [ ] **Step 5: Run test to verify it fails, implement `alunos.js`, run again to verify it passes.**

- [ ] **Step 6: Commit**

```bash
git add src/stores/turmas.js src/stores/materias.js src/stores/alunos.js src/stores/__tests__
git commit -m "feat: add turmas, materias and alunos stores"
```

---

## Task 13: Pinia stores — tarefas, avaliacoes (wired to ConquistaEngine)

**Files:**
- Create: `src/stores/tarefas.js`, `src/stores/avaliacoes.js`
- Test: `src/stores/__tests__/tarefas.test.js`, `src/stores/__tests__/avaliacoes.test.js`

**Interfaces:**
- Consumes: `tarefasRepository`, `avaliacoesRepository` (Task 6); `calcularMediaTarefas`, `calcularNotaFinal` (Task 8); `avaliarConquistas` (Task 9); `conquistasRepository.unlock` (Task 7).
- Produces: `useTarefasStore()` → `{ itemsByTurmaMateria: Ref<...>, error: Ref<string|null>, fetchByTurmaMateria(turmaId, materiaId), add(tarefa), saveNota(alunoId, tarefaId, nota, entregueEm = new Date()) }`; `useAvaliacoesStore()` → `{ itemsByAlunoMateria: Ref<...>, error: Ref<string|null>, fetchByAlunoMateria(alunoId, materiaId), save({alunoId, materiaId, prova1, prova2, participacao}), notaFinalDe(alunoId, materiaId): number }`. Both `saveNota` and `save` call a shared internal `reavaliarConquistas(alunoId)` that builds `alunoContexto`, runs `avaliarConquistas`, and calls `conquistasRepository.unlock` for each returned codigo. `saveNota` passes `entregueEm` through to `tarefasRepository.saveNota(alunoId, tarefaId, nota, entregueEm)` (Task 6) — manual grade entry defaults to "now"; Task 15's `useImportCmsp` passes the CSV's own delivery date when available. `notaFinalDe` internally calls `useTarefasStore()` to pull that student's tarefa notas for `calcularMediaTarefas`, then combines with this store's own `avaliacoes` row via `calcularNotaFinal`. Both actions catch a rejected repository call and set `error` instead of leaving the promise unhandled.

- [ ] **Step 1: Write failing test for `tarefas.js` `saveNota`** — mock `tarefasRepository.saveNota` and `conquistasRepository.unlock`; assert both are called, and `unlock` receives codigos from a stubbed `avaliarConquistas` (mock the domain module).

- [ ] **Step 2: Run test to verify it fails, implement `tarefas.js`, run again to verify it passes.**

- [ ] **Step 3: Write failing test for `avaliacoes.js` `notaFinalDe`** — given stubbed tarefas and avaliacao data in the store, assert it returns `calcularNotaFinal(...)`'s result.

- [ ] **Step 4: Run test to verify it fails, implement `avaliacoes.js`, run again to verify it passes.**

- [ ] **Step 5: Commit**

```bash
git add src/stores/tarefas.js src/stores/avaliacoes.js src/stores/__tests__
git commit -m "feat: add tarefas and avaliacoes stores with conquista evaluation"
```

---

## Task 14: Pinia stores — conquistas, missoes

**Files:**
- Create: `src/stores/conquistas.js`, `src/stores/missoes.js`
- Test: `src/stores/__tests__/conquistas.test.js`, `src/stores/__tests__/missoes.test.js`

**Interfaces:**
- Consumes: `conquistasRepository`, `missoesRepository` (Task 7).
- Produces: `useConquistasStore()` → `{ catalogo: Ref<Conquista[]>, porAluno: Ref<Record<alunoId, Conquista[]>>, error: Ref<string|null>, fetchCatalogo(), fetchByAluno(alunoId), maisRecenteDaTurma(alunoIds): Conquista|null }`; `useMissoesStore()` → `{ atual: Ref<Missao|null>, error: Ref<string|null>, fetchByTurma(turmaId), salvarProgresso(progresso) }`. `salvarProgresso(progresso)` merges `progresso` into the already-loaded `atual.value` and calls `missoesRepository.upsert({ ...atual.value, progressoAtual: progresso })` — it needs no `missaoId` argument since `atual.value` already carries the full row. Both stores catch a rejected repository call and set `error` instead of leaving the promise unhandled.

- [ ] **Step 1: Write failing tests for `conquistas.js`** (`fetchCatalogo`, `fetchByAluno`, and `maisRecenteDaTurma` picking the achievement with the latest `data_conquistada` across the given aluno ids).

- [ ] **Step 2: Run tests to verify they fail, implement `conquistas.js`, run again to verify they pass.**

- [ ] **Step 3: Write failing tests for `missoes.js`** (`fetchByTurma`, `salvarProgresso` calling `missoesRepository.upsert`).

- [ ] **Step 4: Run tests to verify they fail, implement `missoes.js`, run again to verify they pass.**

- [ ] **Step 5: Commit**

```bash
git add src/stores/conquistas.js src/stores/missoes.js src/stores/__tests__
git commit -m "feat: add conquistas and missoes stores"
```

---

## Task 15: Composables — useRanking, useImportCmsp

**Files:**
- Create: `src/composables/useRanking.js`, `src/composables/useImportCmsp.js`
- Test: `src/composables/__tests__/useRanking.test.js`, `src/composables/__tests__/useImportCmsp.test.js`

**Interfaces:**
- Consumes: `useAlunosStore`, `useAvaliacoesStore` (Tasks 12–13); `ImportParserFactory`, `normalizeName` (Task 10); `useTarefasStore` (Task 13).
- Produces: `useRanking(turmaId, materiaId)` returns `{ ranking: ComputedRef<{aluno, notaFinal, posicao}[]> }` sorted desc by `notaFinal` with 1-based `posicao`. `useImportCmsp()` returns `{ importar(tarefaId, file): Promise<{ aplicadas: number, naoEncontrados: string[] }> }` — parses the file, normalizes each row's `nome`, matches against the current turma's `alunos` (also normalized), calls `tarefasStore.saveNota` for matches, and collects names with no match.

- [ ] **Step 1: Write failing test for `useRanking`** — given stubbed alunos and notas producing notas finais `[8, 6, 9]`, assert `ranking.value` is ordered `[{posicao:1, notaFinal:9}, {posicao:2, notaFinal:8}, {posicao:3, notaFinal:6}]`.

- [ ] **Step 2: Run test to verify it fails, implement `useRanking.js`, run again to verify it passes.**

- [ ] **Step 3: Write failing test for `useImportCmsp`** covering: a matched row (name normalizes to an existing aluno) calls `saveNota`, and an unmatched row appears in `naoEncontrados` instead of throwing.

- [ ] **Step 4: Run test to verify it fails, implement `useImportCmsp.js`, run again to verify it passes.**

- [ ] **Step 5: Commit**

```bash
git add src/composables src/composables/__tests__
git commit -m "feat: add ranking and CMSP import composables"
```

---

## Task 16: Base UI kit — AppBackground, TopNav, PixelCard, PixelButton

**Files:**
- Create: `src/components/layout/AppBackground.vue`, `src/components/layout/TopNav.vue`, `src/components/shared/PixelCard.vue`, `src/components/shared/PixelButton.vue`
- Modify: `src/App.vue`
- Test: `src/components/__tests__/TopNav.test.js`

**Interfaces:**
- Produces: `AppBackground.vue` (no props — fixed-position decorative SVG/CSS scene: sky, nuvens, colinas, árvores, castelo silhouette, `aria-hidden="true"`); `TopNav.vue` (props: none, reads `useAuthStore`/`router`; renders links to `/`, `/ranking`, `/conquistas`, `/turmas`, `/sobre`, a profile chip, and a logout button calling `authStore.signOut()`); `PixelCard.vue` (slot-based wrapper with the stepped-border "wood plank" style); `PixelButton.vue` (slot-based button with press effect, `disabled` prop).

- [ ] **Step 1: Write failing test for `TopNav.vue`** — mount with a stubbed router/auth store, assert it renders links for all 5 routes and a logout button that calls `authStore.signOut` on click.

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `AppBackground.vue`, `PixelCard.vue`, `PixelButton.vue`** (pixel-art styling per spec's "Tema visual" section: stepped box-shadow borders, no blur/real gradients, Press Start 2P/VT323 fonts, navy/purple background, neon cyan/magenta/gold accents) **and `TopNav.vue`.**

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Wire `App.vue`** to render `<AppBackground />` + `<TopNav v-if="authStore.user" />` + `<RouterView />`.

- [ ] **Step 6: Manual check** — `npm run dev`, confirm the background and nav render behind/above the login-gated routes without layout overflow at mobile width (375px) and desktop width.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout src/components/shared src/App.vue src/components/__tests__/TopNav.test.js
git commit -m "feat: add pixel-art layout shell and UI kit"
```

---

## Task 17: PodiumTop3 + RankingTable

**Files:**
- Create: `src/components/ranking/PodiumTop3.vue`, `src/components/ranking/RankingTable.vue`
- Test: `src/components/__tests__/PodiumTop3.test.js`, `src/components/__tests__/RankingTable.test.js`

**Interfaces:**
- Consumes: ranking rows shaped `{ aluno: {id, nome, fotoUrl}, notaFinal, posicao }` (from `useRanking`, Task 15).
- Produces: `PodiumTop3.vue` (prop `top3: RankingRow[]`, length 0–3; renders ouro/prata/bronze blocks with crown on 1st, falls back to a pixel default-avatar placeholder when `fotoUrl` is falsy); `RankingTable.vue` (prop `ranking: RankingRow[]`; renders position, avatar, nome, notaFinal; highlights rows with `posicao <= 3`).

- [ ] **Step 1: Write failing test for `PodiumTop3.vue`** — mount with 3 rows including one with `fotoUrl: null`; assert the 1st-place block renders a crown element and the photo-less student renders a fallback avatar element (not a broken `<img>`).

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `PodiumTop3.vue`** (pódium blocks styled per spec, fallback avatar e.g. initials-in-pixel-frame when `fotoUrl` is absent).

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Write failing test for `RankingTable.vue`** — mount with a ranking array, assert row count matches and the first row has a "top3" highlight class while row 4 does not.

- [ ] **Step 6: Run test to verify it fails, implement `RankingTable.vue`, run again to verify it passes.**

- [ ] **Step 7: Commit**

```bash
git add src/components/ranking src/components/__tests__/PodiumTop3.test.js src/components/__tests__/RankingTable.test.js
git commit -m "feat: add podium and ranking table components"
```

---

## Task 18: HomeView + RankingView + PublicTurmaView

**Files:**
- Create: `src/views/HomeView.vue`, `src/views/RankingView.vue`, `src/views/PublicTurmaView.vue`
- Modify: `src/router/index.js` (point `/`, `/ranking`, `/t/:slug` at these views)
- Test: `src/views/__tests__/PublicTurmaView.test.js`

**Interfaces:**
- Consumes: `useTurmasStore`, `useMateriasStore` (Task 12), `useRanking` (Task 15), `PodiumTop3`, `RankingTable` (Task 17), `MissaoSemanalCard`, `ConquistaRecenteCard` (Task 19 — see note below), `publicRepository` (Task 2).
- Produces: `HomeView.vue` (turma/matéria selects at top, trophy banner, `<PodiumTop3>` for the current selection's top 3, `<MissaoSemanalCard>` + `<ConquistaRecenteCard>` side column); `RankingView.vue` (same selects, full `<RankingTable>`); `PublicTurmaView.vue` (reads `route.params.slug`, calls `publicRepository.getTurmaBySlug(slug)` — when it resolves `null`, renders a "turma não encontrada" message instead of the dashboard; otherwise calls `getRankingPublico`/`getConquistasPublicas`/`getMissaoPublica` for that turma and renders `<PodiumTop3>`, `<RankingTable>`, `<ConquistaBadge>` list and a read-only `<MissaoSemanalCard :editable="false">` — no turma/matéria-switcher beyond a matéria select scoped to that one turma, no admin controls).

- [ ] **Step 1: Implement `HomeView.vue`** wiring the turma/matéria selects to `turmasStore`/`materiasStore` and passing `useRanking(selectedTurma, selectedMateria).ranking` sliced to 3 into `PodiumTop3`. Leave `MissaoSemanalCard`/`ConquistaRecenteCard` as empty placeholders if Task 19 has not landed yet in execution order — otherwise wire them fully.

- [ ] **Step 2: Implement `RankingView.vue`** wiring the same selects and passing the full ranking into `RankingTable`.

- [ ] **Step 3: Write failing tests for `PublicTurmaView.vue`** — mount with a stubbed `publicRepository.getTurmaBySlug` resolving `null`; assert a "turma não encontrada" message renders and no podium/table is rendered. Mount again with it resolving a turma; assert the podium/table render.

- [ ] **Step 4: Run tests to verify they fail, implement `PublicTurmaView.vue`, run again to verify they pass.**

- [ ] **Step 5: Update `router/index.js`** to import and use `HomeView`/`RankingView` for `/` and `/ranking`, and `PublicTurmaView` for the public `/t/:slug` route, instead of any stub.

- [ ] **Step 6: Manual check** — `npm run dev`, log in, switch turma/matéria on Home/Ranking; log out and visit `/t/:slug` for a real and a fake slug, confirm the real one shows the dashboard and the fake one shows the not-found message without a console error.

- [ ] **Step 7: Commit**

```bash
git add src/views/HomeView.vue src/views/RankingView.vue src/views/PublicTurmaView.vue src/views/__tests__/PublicTurmaView.test.js src/router/index.js
git commit -m "feat: add home, ranking and public turma views"
```

---

## Task 19: Gamification components + ConquistasView

**Files:**
- Create: `src/components/gamification/MissaoSemanalCard.vue`, `src/components/gamification/ConquistaRecenteCard.vue`, `src/components/gamification/ConquistaBadge.vue`, `src/views/ConquistasView.vue`
- Modify: `src/views/HomeView.vue` (wire the two cards in), `src/router/index.js`
- Test: `src/components/__tests__/MissaoSemanalCard.test.js`

**Interfaces:**
- Consumes: `useMissoesStore`, `useConquistasStore` (Task 14).
- Produces: `MissaoSemanalCard.vue` (props `missao: {titulo, descricao, meta, progressoAtual}`, `editable: boolean = true`; emits `update-progresso` with a new number; when `editable` is `true` shows an inline numeric input + "salvar" `PixelButton`, when `false` shows the progress bar/text only, no input or button); `ConquistaRecenteCard.vue` (prop `conquista: {nome, descricao, icone, aluno: {nome, fotoUrl}} | null`, renders an empty state when `null`); `ConquistaBadge.vue` (props `icone: string, desbloqueada: boolean`, dims when not unlocked); `ConquistasView.vue` (lists the full catalogo via `ConquistaBadge` and, per aluno in the selected turma, which badges they've unlocked).

- [ ] **Step 1: Write failing tests for `MissaoSemanalCard.vue`** — mount with a `missao` prop (default `editable`), type a new value into the progress input, click save, assert `update-progresso` was emitted with the typed number. Add a second test mounting with `editable: false`; assert no numeric input or save button is rendered.

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `MissaoSemanalCard.vue`, `ConquistaRecenteCard.vue`, `ConquistaBadge.vue`.**

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Implement `ConquistasView.vue`** using `conquistasStore.fetchCatalogo` and `fetchByAluno` per aluno of the selected turma.

- [ ] **Step 6: Wire `HomeView.vue`** to pass `missoesStore.atual` into `MissaoSemanalCard` (calling `salvarProgresso` on `update-progresso`) and `conquistasStore.maisRecenteDaTurma(...)` into `ConquistaRecenteCard`.

- [ ] **Step 7: Update `router/index.js`** for `/conquistas`.

- [ ] **Step 8: Manual check** — `npm run dev`, update a mission's progress on Home, confirm it persists after reload (re-fetch from Supabase).

- [ ] **Step 9: Commit**

```bash
git add src/components/gamification src/views/ConquistasView.vue src/views/HomeView.vue src/router/index.js src/components/__tests__/MissaoSemanalCard.test.js
git commit -m "feat: add gamification cards and conquistas view"
```

---

## Task 20: Professor grading area — EditableGradesTable, TaskModal, StudentModal

**Files:**
- Create: `src/components/professor/EditableGradesTable.vue`, `src/components/professor/TaskModal.vue`, `src/components/professor/StudentModal.vue`
- Test: `src/components/__tests__/EditableGradesTable.test.js`

**Interfaces:**
- Consumes: `useAlunosStore`, `useTarefasStore`, `useAvaliacoesStore` (Tasks 12–13).
- Produces: `EditableGradesTable.vue` (prop `turmaId, materiaId`; one row per aluno with numeric inputs for each tarefa's nota, Prova1, Prova2, Participação, debounced-saving via the stores on blur); `TaskModal.vue` (emits `save` with `{titulo, cmspLink, dataEntrega, notaMaxima}`, validates required fields before emitting); `StudentModal.vue` (emits `save` with `{nome}` plus an optional photo `File`, calls `alunosStore.uploadFoto` after the aluno is created).

- [ ] **Step 1: Write failing test for `EditableGradesTable.vue`** — mount with one stubbed aluno and one tarefa, change the nota input, trigger blur, assert `tarefasStore.saveNota` (mocked) was called with the new value.

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `EditableGradesTable.vue`, `TaskModal.vue`, `StudentModal.vue`.**

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Commit**

```bash
git add src/components/professor/EditableGradesTable.vue src/components/professor/TaskModal.vue src/components/professor/StudentModal.vue src/components/__tests__/EditableGradesTable.test.js
git commit -m "feat: add editable grades table and task/student modals"
```

---

## Task 21: Professor import/admin — ImportCmspModal, TurmaMateriaForm, TurmasView

**Files:**
- Create: `src/components/professor/ImportCmspModal.vue`, `src/components/professor/TurmaMateriaForm.vue`, `src/views/TurmasView.vue`
- Modify: `src/router/index.js`
- Test: `src/components/__tests__/ImportCmspModal.test.js`

**Interfaces:**
- Consumes: `useImportCmsp` (Task 15), `useTurmasStore`, `useMateriasStore`, `useTarefasStore` (Tasks 12–13), `EditableGradesTable`, `TaskModal`, `StudentModal` (Task 20).
- Produces: `ImportCmspModal.vue` (prop `tarefaId`; file input → calls `useImportCmsp().importar`; shows a summary of `aplicadas` and `naoEncontrados` after import); `TurmaMateriaForm.vue` (two small forms to create turma/materia, emitting `created`); `TurmasView.vue` (composes turma/matéria management — each turma row shows its public link `${window.location.origin}/t/${turma.slug}` with a "copiar link" button — aluno list with `StudentModal`, tarefa list with `TaskModal` + `ImportCmspModal` trigger, and `EditableGradesTable`).

- [ ] **Step 1: Write failing test for `ImportCmspModal.vue`** — mount, stub `useImportCmsp` to resolve `{ aplicadas: 2, naoEncontrados: ['Fulano'] }` on a simulated file input change, assert the summary text shows both numbers.

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `ImportCmspModal.vue`, `TurmaMateriaForm.vue`, `TurmasView.vue`.**

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Update `router/index.js`** for `/turmas`.

- [ ] **Step 6: Manual check** — `npm run dev`, create a turma, a matéria, an aluno with photo, a tarefa, import a sample CSV, confirm notas and the ranking update.

- [ ] **Step 7: Commit**

```bash
git add src/components/professor/ImportCmspModal.vue src/components/professor/TurmaMateriaForm.vue src/views/TurmasView.vue src/router/index.js src/components/__tests__/ImportCmspModal.test.js
git commit -m "feat: add CMSP import modal and turmas management view"
```

---

## Task 22: ExportImportJson + SobreView

**Files:**
- Create: `src/components/shared/ExportImportJson.vue`, `src/views/SobreView.vue`
- Modify: `src/views/TurmasView.vue`, `src/router/index.js`
- Test: `src/components/__tests__/ExportImportJson.test.js`

**Interfaces:**
- Consumes: all data stores (Tasks 12–14) to assemble/restore a full JSON snapshot `{ turmas, materias, alunos, tarefas, avaliacoes, conquistas, missoes }`.
- Produces: `ExportImportJson.vue` with an "Exportar" button that downloads the snapshot as a `.json` file, and an "Importar" file input that parses a JSON file and calls each store's bulk-restore path (reuse existing `create`/`upsert` actions per item).

- [ ] **Step 1: Write failing test for `ExportImportJson.vue`'s export** — stub the stores' state, click "Exportar", assert a Blob/download was triggered with the expected JSON shape (spy on `URL.createObjectURL`).

- [ ] **Step 2: Run test to verify it fails.**

- [ ] **Step 3: Implement `ExportImportJson.vue`.**

- [ ] **Step 4: Run test to verify it passes.**

- [ ] **Step 5: Implement `SobreView.vue`** (static page describing ClassRank, per spec's "página estática").

- [ ] **Step 6: Wire `ExportImportJson` into `TurmasView.vue`; update `router/index.js` for `/sobre`.**

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/ExportImportJson.vue src/views/SobreView.vue src/views/TurmasView.vue src/router/index.js src/components/__tests__/ExportImportJson.test.js
git commit -m "feat: add JSON export/import and about view"
```

---

## Task 23: Final app wiring + manual browser verification

**Files:**
- Modify: `src/App.vue`, `src/router/index.js` (remove any remaining stubs), `README.md` (create, with setup instructions: env vars, `npm install`, `npm run dev`, `npm run test`)

**Interfaces:**
- N/A — integration task.

- [ ] **Step 1: Run the full test suite** — Run: `npm run test` — Expected: all tests pass.

- [ ] **Step 2: Start the dev server and walk the golden path in the browser**: login → create turma/matéria → add aluno with photo → add tarefa → lançar notas (tarefa, provas, participação) → confirm Home shows the correct Top-3 podium with crown/fotos → confirm an achievement unlocks on Conquistas after qualifying notas → update the missão semanal progress and confirm it persists after reload → export JSON and re-import it into a cleared state.

- [ ] **Step 3: Check responsive layout** at 375px and 1280px widths for `HomeView`, `RankingView`, and `TurmasView` — no horizontal overflow.

- [ ] **Step 4: Write `README.md`** with setup/run instructions.

- [ ] **Step 5: Commit**

```bash
git add README.md src/App.vue src/router/index.js
git commit -m "chore: final wiring and verification pass"
```

---

## Task 24: Deploy to Vercel

**Files:**
- Create: `vercel.json`

**Interfaces:**
- N/A — deployment task.

- [ ] **Step 1: Write `vercel.json`** with a catch-all rewrite (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`) so client-side routes (`/t/:slug`, `/turmas`, etc.) resolve on a hard refresh/direct link instead of 404ing.

- [ ] **Step 2: Create the Vercel project** linked to this repository (via the Vercel MCP tools), framework preset Vite.

- [ ] **Step 3: Set environment variables** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on the Vercel project (same values as `.env.local` from Task 3), for the Production environment.

- [ ] **Step 4: Trigger a deployment** and wait for it to reach `READY`.

- [ ] **Step 5: Verify the live deployment** — fetch the deployed `/login` and a known `/t/:slug` URL, confirm both return 200 (not 404), and confirm `/turmas` redirects to `/login` when visited logged-out.

- [ ] **Step 6: Commit**

```bash
git add vercel.json
git commit -m "chore: configure Vercel deployment"
```

## Self-Review Notes

- **Spec coverage:** turmas/matérias/alunos (Tasks 4–5, 12), tarefas CMSP + import (Tasks 6, 10, 21), avaliações + nota final (Tasks 6, 8, 13), ranking + pódium (Tasks 15, 17–18), conquistas (Tasks 7, 9, 14, 19), missão semanal (Tasks 7, 14, 19), export/import JSON (Task 22), login do professor + acesso público por turma (Tasks 2, 11, 18), tema pixel art (Tasks 16–17), deploy (Task 24). All spec sections map to at least one task.
- **Review Focus coverage:** normalização de nota de tarefa e lista vazia → Task 8; nome não encontrado na importação → Task 10; conquista "Pontual" vs prazo → Task 9; aluno sem foto → Task 17; slug inexistente → Task 18; erro de repository não tratado na store → Tasks 12–14, 20–22.
- **Proportion:** code blocks are limited to signatures/test assertions; component bodies are left to the implementer except where the spec pins exact behavior (pixel theme rules, formulas, rule codes, RPC function contracts).
