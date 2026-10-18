<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useTurmasStore } from '../stores/turmas.js'
import { useMateriasStore } from '../stores/materias.js'
import { useAlunosStore } from '../stores/alunos.js'
import { useTarefasStore } from '../stores/tarefas.js'
import { useAvaliacoesStore } from '../stores/avaliacoes.js'
import { useConquistasStore } from '../stores/conquistas.js'
import { useTurmaMateriasStore } from '../stores/turmaMaterias.js'
import { useRanking } from '../composables/useRanking.js'
import { avaliarConquistas } from '../domain/ConquistaEngine.js'
import PodiumTop3 from '../components/PodiumTop3.vue'
import { classificarRanking } from '../domain/RankingPosicoes.js'
import { ImportParserFactory } from '../domain/importParsers/ImportParserFactory.js'
import { casarNotasComAlunos } from '../domain/importParsers/casarNotasComAlunos.js'
import { gerarModeloPlanilha, nomeArquivoModelo } from '../domain/importParsers/modeloPlanilha.js'

const turmasStore = useTurmasStore()
const materiasStore = useMateriasStore()
const alunosStore = useAlunosStore()
const tarefasStore = useTarefasStore()
const avaliacoesStore = useAvaliacoesStore()
const conquistasStore = useConquistasStore()
const turmaMateriasStore = useTurmaMateriasStore()

const turmaId = ref('')
const materiaId = ref('')

const materiasDaTurma = computed(() => {
  const ids = turmaMateriasStore.materiaIdsByTurma[turmaId.value] ?? []
  return materiasStore.items.filter((m) => ids.includes(m.id))
})

watch(turmaId, async (novoId) => {
  materiaId.value = ''
  if (novoId) await turmaMateriasStore.fetchByTurma(novoId)
})

const novaTarefa = ref({ titulo: '', cmspLink: '', dataEntrega: '', notaMaxima: 10 })

const alunos = computed(() => alunosStore.itemsByTurma[turmaId.value] ?? [])
const tarefas = computed(
  () => tarefasStore.itemsByTurmaMateria[`${turmaId.value}:${materiaId.value}`] ?? []
)
const avaliacoesByAluno = computed(() => {
  const map = {}
  for (const aluno of alunos.value) {
    map[aluno.id] = avaliacoesStore.itemsByAlunoMateria[`${aluno.id}:${materiaId.value}`]
  }
  return map
})

// Rascunho local por aluno: evita que dois campos (prova1/prova2/participação)
// salvos quase ao mesmo tempo pisem um no outro — o @change de cada input lê o
// rascunho inteiro (já atualizado de forma síncrona pelo v-model), nunca o
// valor possivelmente desatualizado que ainda está no store.
const avaliacoesDraft = reactive({})

watch(
  avaliacoesByAluno,
  (map) => {
    for (const [alunoId, av] of Object.entries(map)) {
      avaliacoesDraft[alunoId] = {
        prova1: av?.prova1 ?? null,
        prova2: av?.prova2 ?? null,
        participacao: av?.participacao ?? null
      }
    }
  },
  { deep: true }
)

const ranking = useRanking({
  alunos,
  tarefas,
  notasByTarefa: computed(() => tarefasStore.notasByTarefa),
  avaliacoesByAluno
})

// Empatados recebem a mesma posição na coluna "#"
const posicaoPorAluno = computed(
  () => new Map(classificarRanking(ranking.value).map((l) => [l.aluno.id, l.posicao]))
)

onMounted(async () => {
  await Promise.all([turmasStore.fetchAll(), materiasStore.fetchAll()])
})

async function carregarDados() {
  if (!turmaId.value || !materiaId.value) return
  await alunosStore.fetchByTurma(turmaId.value)
  await tarefasStore.fetchByTurmaMateria(turmaId.value, materiaId.value)
  await Promise.all(alunos.value.map((a) => avaliacoesStore.fetchByAlunoMateria(a.id, materiaId.value)))
}

watch([turmaId, materiaId], carregarDados)

async function criarTarefa() {
  if (!novaTarefa.value.titulo.trim() || !novaTarefa.value.dataEntrega || !novaTarefa.value.notaMaxima) return
  await tarefasStore.add({
    turmaId: turmaId.value,
    materiaId: materiaId.value,
    titulo: novaTarefa.value.titulo.trim(),
    cmspLink: novaTarefa.value.cmspLink.trim() || null,
    dataEntrega: novaTarefa.value.dataEntrega,
    notaMaxima: Number(novaTarefa.value.notaMaxima)
  })
  novaTarefa.value = { titulo: '', cmspLink: '', dataEntrega: '', notaMaxima: 10 }
}

// Importação de notas de uma tarefa a partir do relatório da CMSP (CSV ou Excel):
// lê o arquivo, mostra a prévia (quem casou e quem ficou de fora) e só grava depois da confirmação
const importacao = ref({ tarefaId: '', previa: null, erro: null, salvando: false, resultado: null })
const inputArquivo = ref(null)

const tarefaDaImportacao = computed(() => tarefas.value.find((t) => t.id === importacao.value.tarefaId))
const substituidas = computed(() => {
  const previa = importacao.value.previa
  if (!previa) return 0
  return previa.encontrados.filter((e) => notaDaTarefa(importacao.value.tarefaId, e.aluno.id) !== '').length
})

function limparImportacao() {
  importacao.value = { ...importacao.value, previa: null, erro: null, resultado: null }
  if (inputArquivo.value) inputArquivo.value.value = ''
}

watch(() => importacao.value.tarefaId, limparImportacao)
watch([turmaId, materiaId], () => (importacao.value.tarefaId = ''))

async function baixarModelo() {
  const tarefa = tarefaDaImportacao.value
  if (!tarefa) return
  const buffer = await gerarModeloPlanilha(alunos.value, tarefa)
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivoModelo(tarefa)
  link.click()
  URL.revokeObjectURL(url)
}

async function lerArquivo(evento) {
  const arquivo = evento.target.files?.[0]
  importacao.value = { ...importacao.value, previa: null, erro: null, resultado: null }
  if (!arquivo || !tarefaDaImportacao.value) return
  try {
    const linhas = await ImportParserFactory.create(arquivo).parse(arquivo)
    if (linhas.length === 0) throw new Error('A planilha não tem nenhuma linha de aluno depois do cabeçalho.')
    importacao.value.previa = casarNotasComAlunos(linhas, alunos.value, Number(tarefaDaImportacao.value.notaMaxima))
  } catch (err) {
    importacao.value.erro = err.message
  }
}

async function confirmarImportacao() {
  const { tarefaId, previa } = importacao.value
  if (!previa || previa.encontrados.length === 0) return
  importacao.value.salvando = true
  const entregueEm = new Date().toISOString()
  let lancadas = 0
  for (const { aluno, nota } of previa.encontrados) {
    await tarefasStore.saveNota(aluno.id, tarefaId, nota, entregueEm)
    if (tarefasStore.error) break
    lancadas += 1
    await verificarConquistas(aluno.id)
  }
  const resultado = tarefasStore.error
    ? `Parou depois de ${lancadas} nota(s): ${tarefasStore.error}`
    : `${lancadas} nota(s) lançada(s).`
  limparImportacao()
  importacao.value.salvando = false
  importacao.value.resultado = resultado
}

function notaDaTarefa(tarefaId, alunoId) {
  return tarefasStore.notasByTarefa[tarefaId]?.[alunoId]?.nota ?? ''
}

async function salvarNota(tarefaId, alunoId, valor) {
  if (valor === '' || valor === null) return
  await tarefasStore.saveNota(alunoId, tarefaId, Number(valor), new Date().toISOString())
  await verificarConquistas(alunoId)
}

async function salvarAvaliacao(alunoId) {
  const draft = avaliacoesDraft[alunoId]
  await avaliacoesStore.upsert({
    alunoId,
    materiaId: materiaId.value,
    prova1: draft.prova1,
    prova2: draft.prova2,
    participacao: draft.participacao
  })
  await verificarConquistas(alunoId)
}

// Monta o contexto do aluno e roda as 3 regras de conquista (Strategy):
// pontual (entregou tudo no prazo), nota_maxima (nota final >= 9) e
// presença exemplar (participação >= 9 em TODAS as matérias já avaliadas).
async function verificarConquistas(alunoId) {
  const linha = ranking.value.find((l) => l.aluno.id === alunoId)
  if (!linha) return

  const tarefasEntregues = tarefas.value
    .map((tarefa) => {
      const nota = tarefasStore.notasByTarefa[tarefa.id]?.[alunoId]
      if (!nota?.entregueEm) return null
      return { dataEntrega: new Date(nota.entregueEm), prazo: new Date(tarefa.dataEntrega) }
    })
    .filter(Boolean)

  const avaliacoesDoAluno = await avaliacoesStore.listByAluno(alunoId)
  const participacaoPorMateria = avaliacoesDoAluno
    .map((av) => av.participacao)
    .filter((p) => p !== null && p !== undefined)

  const codigosDesbloqueados = avaliarConquistas({
    tarefasEntregues,
    notaFinal: linha.notaFinal,
    participacaoPorMateria
  })

  for (const codigo of codigosDesbloqueados) {
    await conquistasStore.unlock(alunoId, codigo)
  }
}

// Histórico de tarefas já lançadas por aluno — fica tudo registrado (nenhuma
// tarefa some do painel ao ser lançada), só expande/recolhe por aluno.
const historicoAberto = reactive({})

function alternarHistorico(alunoId) {
  historicoAberto[alunoId] = !historicoAberto[alunoId]
}

function historicoDoAluno(alunoId) {
  return tarefas.value.map((tarefa) => {
    const nota = tarefasStore.notasByTarefa[tarefa.id]?.[alunoId]
    return {
      tarefaId: tarefa.id,
      titulo: tarefa.titulo,
      notaMaxima: tarefa.notaMaxima,
      nota: nota?.nota ?? null,
      entregueEm: nota?.entregueEm ?? null
    }
  })
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-pixel text-rank-gold text-lg">Lançar notas e ranking</h1>

    <div class="pixel-corners pixel-panel flex flex-wrap gap-3 p-4">
      <select v-model="turmaId" class="pixel-input pixel-corners px-2 py-1 text-xl">
        <option value="">Selecione a turma</option>
        <option v-for="turma in turmasStore.items" :key="turma.id" :value="turma.id">{{ turma.nome }}</option>
      </select>
      <select v-model="materiaId" class="pixel-input pixel-corners px-2 py-1 text-xl" :disabled="!turmaId">
        <option value="">Selecione a matéria</option>
        <option v-for="materia in materiasDaTurma" :key="materia.id" :value="materia.id">
          {{ materia.nome }}
        </option>
      </select>
    </div>
    <p v-if="turmaId && materiasDaTurma.length === 0" class="text-slate-200 text-sm">
      Essa turma ainda não tem matérias ligadas. Vá em "Turmas" e marque as matérias dela.
    </p>

    <template v-if="turmaId && materiaId">
      <section class="pixel-corners pixel-panel p-4 space-y-3">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide">Tarefas (CMSP)</h2>
        <p v-if="tarefasStore.error" class="text-red-400 text-sm">{{ tarefasStore.error }}</p>
        <ul class="flex flex-wrap gap-2 text-sm">
          <li v-for="tarefa in tarefas" :key="tarefa.id" class="pixel-corners bg-rank-navy px-2 py-1">
            {{ tarefa.titulo }} (máx {{ tarefa.notaMaxima }})
          </li>
        </ul>
        <form class="flex flex-wrap gap-2 items-end text-xl" @submit.prevent="criarTarefa">
          <input
            v-model="novaTarefa.titulo"
            type="text"
            placeholder="Título"
            class="pixel-input pixel-corners px-2 py-1"
          />
          <input
            v-model="novaTarefa.cmspLink"
            type="text"
            placeholder="Link CMSP (opcional)"
            class="pixel-input pixel-corners px-2 py-1"
          />
          <input v-model="novaTarefa.dataEntrega" type="date" class="pixel-input pixel-corners px-2 py-1" />
          <input
            v-model="novaTarefa.notaMaxima"
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Nota máxima"
            class="pixel-input pixel-corners px-2 py-1 w-28"
          />
          <button type="submit" class="pixel-corners pixel-btn px-3 py-2">Adicionar tarefa</button>
        </form>
      </section>

      <section class="pixel-corners pixel-panel p-4 space-y-3">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide">Importar notas (CSV ou Excel)</h2>
        <p class="text-base text-slate-200">
          Escolha a tarefa e baixe o modelo: ele já vem com todos os alunos da turma, é só digitar as notas e enviar.
          Aluno com a nota em branco fica de fora. Também serve outra planilha com o nome na 1ª coluna e a nota na 2ª
          (os nomes são comparados sem acento e sem diferença de maiúscula).
        </p>
        <p v-if="tarefas.length === 0" class="text-slate-200 text-sm">Cadastre a tarefa acima antes de importar as notas dela.</p>
        <div v-else class="flex flex-wrap gap-3 items-center text-xl">
          <select v-model="importacao.tarefaId" class="pixel-input pixel-corners px-2 py-1 max-w-full">
            <option value="">Escolha a tarefa</option>
            <option v-for="tarefa in tarefas" :key="tarefa.id" :value="tarefa.id">{{ tarefa.titulo }}</option>
          </select>
          <button
            type="button"
            class="pixel-corners pixel-btn px-3 py-2 text-base"
            :disabled="!importacao.tarefaId || alunos.length === 0"
            @click="baixarModelo"
          >
            Baixar modelo
          </button>
          <input
            ref="inputArquivo"
            type="file"
            accept=".csv,.xlsx,.xls"
            class="text-base max-w-full"
            :disabled="!importacao.tarefaId"
            @change="lerArquivo"
          />
        </div>
        <p v-if="importacao.erro" class="text-red-400 text-sm">{{ importacao.erro }}</p>
        <p v-if="importacao.resultado" class="text-green-400 text-base">{{ importacao.resultado }}</p>

        <div v-if="importacao.previa" class="space-y-3 text-lg">
          <p>
            <span class="text-green-400">{{ importacao.previa.encontrados.length }} nota(s) prontas para lançar</span>
            em "{{ tarefaDaImportacao?.titulo }}" (máx {{ tarefaDaImportacao?.notaMaxima }})<span v-if="substituidas > 0">,
            {{ substituidas }} vão substituir nota já lançada</span>.
          </p>
          <ul v-if="importacao.previa.encontrados.length > 0" class="flex flex-wrap gap-2 text-base">
            <li v-for="e in importacao.previa.encontrados" :key="e.aluno.id" class="pixel-corners bg-rank-navy px-2 py-1">
              {{ e.aluno.nome }}: <span class="text-rank-gold">{{ e.nota }}</span>
            </li>
          </ul>
          <div v-if="importacao.previa.problemas.length > 0">
            <p class="text-red-400">{{ importacao.previa.problemas.length }} linha(s) ficam de fora:</p>
            <ul class="text-base space-y-1">
              <li v-for="(p, i) in importacao.previa.problemas" :key="i">
                {{ p.nome || '(sem nome)' }} — {{ Number.isFinite(p.nota) ? p.nota : 'sem nota' }}:
                <span class="text-red-300">{{ p.motivo }}</span>
              </li>
            </ul>
          </div>
          <div class="flex gap-2">
            <button
              class="pixel-corners pixel-btn px-3 py-2"
              :disabled="importacao.salvando || importacao.previa.encontrados.length === 0"
              @click="confirmarImportacao"
            >
              {{ importacao.salvando ? 'Lançando...' : `Lançar ${importacao.previa.encontrados.length} nota(s)` }}
            </button>
            <button class="pixel-corners pixel-btn px-3 py-2 opacity-80" :disabled="importacao.salvando" @click="limparImportacao">
              Cancelar
            </button>
          </div>
        </div>
      </section>

      <section class="pixel-corners pixel-panel p-4 overflow-x-auto">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-1">Ranking</h2>
        <p v-if="avaliacoesStore.error" class="text-red-400 text-sm">{{ avaliacoesStore.error }}</p>

        <PodiumTop3 v-if="ranking.length > 0" :linhas="ranking" />

        <table class="min-w-full text-sm text-xl">
          <thead>
            <tr class="text-left border-b border-rank-navy text-rank-gold">
              <th class="p-2">#</th>
              <th class="p-2">Aluno</th>
              <th v-for="tarefa in tarefas" :key="tarefa.id" class="p-2">{{ tarefa.titulo }}</th>
              <th class="p-2">Prova 1</th>
              <th class="p-2">Prova 2</th>
              <th class="p-2">Participação</th>
              <th class="p-2">Nota final</th>
              <th class="p-2">Histórico</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="linha in ranking" :key="linha.aluno.id">
            <tr
              :class="posicaoPorAluno.get(linha.aluno.id) <= 3 ? 'bg-rank-navy' : ''"
              class="border-b border-rank-navy"
            >
              <td class="p-2">{{ posicaoPorAluno.get(linha.aluno.id) }}º {{ posicaoPorAluno.get(linha.aluno.id) <= 3 ? '🏆' : '' }}</td>
              <td class="p-2">{{ linha.aluno.nome }}</td>
              <td v-for="tarefa in tarefas" :key="tarefa.id" class="p-2">
                <input
                  type="number"
                  step="0.1"
                  class="pixel-input pixel-corners px-1 w-16"
                  :value="notaDaTarefa(tarefa.id, linha.aluno.id)"
                  @change="salvarNota(tarefa.id, linha.aluno.id, $event.target.value)"
                />
              </td>
              <td class="p-2" v-if="avaliacoesDraft[linha.aluno.id]">
                <input
                  v-model.number="avaliacoesDraft[linha.aluno.id].prova1"
                  type="number"
                  step="0.1"
                  class="pixel-input pixel-corners px-1 w-16"
                  @change="salvarAvaliacao(linha.aluno.id)"
                />
              </td>
              <td class="p-2" v-if="avaliacoesDraft[linha.aluno.id]">
                <input
                  v-model.number="avaliacoesDraft[linha.aluno.id].prova2"
                  type="number"
                  step="0.1"
                  class="pixel-input pixel-corners px-1 w-16"
                  @change="salvarAvaliacao(linha.aluno.id)"
                />
              </td>
              <td class="p-2" v-if="avaliacoesDraft[linha.aluno.id]">
                <input
                  v-model.number="avaliacoesDraft[linha.aluno.id].participacao"
                  type="number"
                  step="0.1"
                  class="pixel-input pixel-corners px-1 w-16"
                  @change="salvarAvaliacao(linha.aluno.id)"
                />
              </td>
              <td class="p-2 font-pixel text-xs text-rank-gold">{{ linha.notaFinal.toFixed(1) }}</td>
              <td class="p-2">
                <button class="pixel-corners pixel-btn px-2 py-1 text-base" @click="alternarHistorico(linha.aluno.id)">
                  {{ historicoAberto[linha.aluno.id] ? 'Fechar' : 'Ver' }}
                </button>
              </td>
            </tr>
            <tr v-if="historicoAberto[linha.aluno.id]" class="border-b border-rank-navy bg-rank-navyDark">
              <td :colspan="tarefas.length + 7" class="p-3">
                <p class="text-rank-gold text-xl uppercase tracking-wide mb-2">
                  Histórico de {{ linha.aluno.nome }} — pontuação acumulada no bimestre
                </p>
                <ul class="text-lg space-y-1">
                  <li v-for="item in historicoDoAluno(linha.aluno.id)" :key="item.tarefaId">
                    <span v-if="item.nota !== null" class="text-green-400">✔</span>
                    <span v-else class="text-slate-200">○</span>
                    {{ item.titulo }} —
                    <span v-if="item.nota !== null">{{ item.nota }} / {{ item.notaMaxima }}</span>
                    <span v-else class="text-slate-200">ainda não lançada</span>
                  </li>
                  <li v-if="tarefas.length === 0" class="text-slate-200">Nenhuma tarefa cadastrada ainda.</li>
                </ul>
                <p class="text-lg mt-2">
                  Média das tarefas: <span class="text-rank-gold">{{ linha.mediaTarefas.toFixed(1) }}</span>
                  — Nota final atual: <span class="text-rank-gold">{{ linha.notaFinal.toFixed(1) }}</span>
                </p>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
        <p v-if="alunos.length === 0" class="text-slate-200 text-sm mt-2">
          Nenhum aluno nesta turma ainda. Cadastre em "Turmas".
        </p>
      </section>
    </template>
  </div>
</template>
