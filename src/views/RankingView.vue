<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useTurmasStore } from '../stores/turmas.js'
import { useMateriasStore } from '../stores/materias.js'
import { useAlunosStore } from '../stores/alunos.js'
import { useTarefasStore } from '../stores/tarefas.js'
import { useAvaliacoesStore } from '../stores/avaliacoes.js'
import { useConquistasStore } from '../stores/conquistas.js'
import { useRanking } from '../composables/useRanking.js'
import { notaMaximaRule } from '../domain/conquistaRules/notaMaximaRule.js'
import PodiumTop3 from '../components/PodiumTop3.vue'

const turmasStore = useTurmasStore()
const materiasStore = useMateriasStore()
const alunosStore = useAlunosStore()
const tarefasStore = useTarefasStore()
const avaliacoesStore = useAvaliacoesStore()
const conquistasStore = useConquistasStore()

const turmaId = ref('')
const materiaId = ref('')

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

function notaDaTarefa(tarefaId, alunoId) {
  return tarefasStore.notasByTarefa[tarefaId]?.[alunoId]?.nota ?? ''
}

async function salvarNota(tarefaId, alunoId, valor) {
  if (valor === '' || valor === null) return
  await tarefasStore.saveNota(alunoId, tarefaId, Number(valor), new Date().toISOString())
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
  await verificarNotaMaxima(alunoId)
}

async function verificarNotaMaxima(alunoId) {
  const linha = ranking.value.find((l) => l.aluno.id === alunoId)
  if (linha && notaMaximaRule.avaliar({ notaFinal: linha.notaFinal })) {
    await conquistasStore.unlock(alunoId, notaMaximaRule.codigo)
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-pixel text-rank-gold text-lg">Lançar notas e ranking</h1>

    <div class="pixel-corners pixel-panel flex flex-wrap gap-3 p-4">
      <select v-model="turmaId" class="pixel-input pixel-corners px-2 py-1 font-retro text-lg">
        <option value="">Selecione a turma</option>
        <option v-for="turma in turmasStore.items" :key="turma.id" :value="turma.id">{{ turma.nome }}</option>
      </select>
      <select v-model="materiaId" class="pixel-input pixel-corners px-2 py-1 font-retro text-lg">
        <option value="">Selecione a matéria</option>
        <option v-for="materia in materiasStore.items" :key="materia.id" :value="materia.id">
          {{ materia.nome }}
        </option>
      </select>
    </div>

    <template v-if="turmaId && materiaId">
      <section class="pixel-corners pixel-panel p-4 space-y-3">
        <h2 class="font-pixel text-rank-gold text-xs">Tarefas (CMSP)</h2>
        <p v-if="tarefasStore.error" class="text-red-400 text-sm font-retro">{{ tarefasStore.error }}</p>
        <ul class="flex flex-wrap gap-2 text-sm font-retro">
          <li v-for="tarefa in tarefas" :key="tarefa.id" class="pixel-corners bg-rank-navy px-2 py-1">
            {{ tarefa.titulo }} (máx {{ tarefa.notaMaxima }})
          </li>
        </ul>
        <form class="flex flex-wrap gap-2 items-end font-retro text-lg" @submit.prevent="criarTarefa">
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

      <section class="pixel-corners pixel-panel p-4 overflow-x-auto">
        <h2 class="font-pixel text-rank-gold text-xs mb-1">Ranking</h2>
        <p v-if="avaliacoesStore.error" class="text-red-400 text-sm font-retro">{{ avaliacoesStore.error }}</p>

        <PodiumTop3 v-if="ranking.length > 0" :linhas="ranking" />

        <table class="min-w-full text-sm font-retro text-lg">
          <thead>
            <tr class="text-left border-b border-rank-navy text-rank-gold">
              <th class="p-2">#</th>
              <th class="p-2">Aluno</th>
              <th v-for="tarefa in tarefas" :key="tarefa.id" class="p-2">{{ tarefa.titulo }}</th>
              <th class="p-2">Prova 1</th>
              <th class="p-2">Prova 2</th>
              <th class="p-2">Participação</th>
              <th class="p-2">Nota final</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(linha, index) in ranking"
              :key="linha.aluno.id"
              :class="index < 3 ? 'bg-rank-navy' : ''"
              class="border-b border-rank-navy"
            >
              <td class="p-2">{{ index + 1 }}º {{ index < 3 ? '🏆' : '' }}</td>
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
            </tr>
          </tbody>
        </table>
        <p v-if="alunos.length === 0" class="text-slate-400 text-sm font-retro mt-2">
          Nenhum aluno nesta turma ainda. Cadastre em "Turmas".
        </p>
      </section>
    </template>
  </div>
</template>
