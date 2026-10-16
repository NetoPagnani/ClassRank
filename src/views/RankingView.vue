<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTurmasStore } from '../stores/turmas.js'
import { useMateriasStore } from '../stores/materias.js'
import { useAlunosStore } from '../stores/alunos.js'
import { useTarefasStore } from '../stores/tarefas.js'
import { useAvaliacoesStore } from '../stores/avaliacoes.js'
import { useConquistasStore } from '../stores/conquistas.js'
import { useRanking } from '../composables/useRanking.js'
import { notaMaximaRule } from '../domain/conquistaRules/notaMaximaRule.js'

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

async function salvarAvaliacao(alunoId, campo, valor) {
  const atual = avaliacoesByAluno.value[alunoId] ?? { prova1: null, prova2: null, participacao: null }
  await avaliacoesStore.upsert({
    alunoId,
    materiaId: materiaId.value,
    prova1: campo === 'prova1' ? Number(valor) : atual.prova1,
    prova2: campo === 'prova2' ? Number(valor) : atual.prova2,
    participacao: campo === 'participacao' ? Number(valor) : atual.participacao
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
    <h1 class="text-2xl font-bold">Lançar notas e ranking</h1>

    <div class="flex flex-wrap gap-3 bg-white rounded-lg shadow p-4">
      <select v-model="turmaId" class="border rounded px-2 py-1">
        <option value="">Selecione a turma</option>
        <option v-for="turma in turmasStore.items" :key="turma.id" :value="turma.id">{{ turma.nome }}</option>
      </select>
      <select v-model="materiaId" class="border rounded px-2 py-1">
        <option value="">Selecione a matéria</option>
        <option v-for="materia in materiasStore.items" :key="materia.id" :value="materia.id">
          {{ materia.nome }}
        </option>
      </select>
    </div>

    <template v-if="turmaId && materiaId">
      <section class="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 class="font-semibold text-lg">Tarefas (CMSP)</h2>
        <p v-if="tarefasStore.error" class="text-red-600 text-sm">{{ tarefasStore.error }}</p>
        <ul class="flex flex-wrap gap-2 text-sm">
          <li v-for="tarefa in tarefas" :key="tarefa.id" class="bg-slate-100 rounded px-2 py-1">
            {{ tarefa.titulo }} (máx {{ tarefa.notaMaxima }})
          </li>
        </ul>
        <form class="flex flex-wrap gap-2 items-end" @submit.prevent="criarTarefa">
          <input v-model="novaTarefa.titulo" type="text" placeholder="Título" class="border rounded px-2 py-1" />
          <input
            v-model="novaTarefa.cmspLink"
            type="text"
            placeholder="Link CMSP (opcional)"
            class="border rounded px-2 py-1"
          />
          <input v-model="novaTarefa.dataEntrega" type="date" class="border rounded px-2 py-1" />
          <input
            v-model="novaTarefa.notaMaxima"
            type="number"
            min="0.01"
            step="0.5"
            placeholder="Nota máxima"
            class="border rounded px-2 py-1 w-28"
          />
          <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded">Adicionar tarefa</button>
        </form>
      </section>

      <section class="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <h2 class="font-semibold text-lg mb-3">Ranking</h2>
        <p v-if="avaliacoesStore.error" class="text-red-600 text-sm">{{ avaliacoesStore.error }}</p>
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left border-b">
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
              :class="index < 3 ? 'bg-amber-50 font-medium' : ''"
              class="border-b"
            >
              <td class="p-2">{{ index + 1 }}º {{ index < 3 ? '🏆' : '' }}</td>
              <td class="p-2">{{ linha.aluno.nome }}</td>
              <td v-for="tarefa in tarefas" :key="tarefa.id" class="p-2">
                <input
                  type="number"
                  step="0.1"
                  class="border rounded px-1 w-16"
                  :value="notaDaTarefa(tarefa.id, linha.aluno.id)"
                  @change="salvarNota(tarefa.id, linha.aluno.id, $event.target.value)"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  step="0.1"
                  class="border rounded px-1 w-16"
                  :value="avaliacoesByAluno[linha.aluno.id]?.prova1 ?? ''"
                  @change="salvarAvaliacao(linha.aluno.id, 'prova1', $event.target.value)"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  step="0.1"
                  class="border rounded px-1 w-16"
                  :value="avaliacoesByAluno[linha.aluno.id]?.prova2 ?? ''"
                  @change="salvarAvaliacao(linha.aluno.id, 'prova2', $event.target.value)"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  step="0.1"
                  class="border rounded px-1 w-16"
                  :value="avaliacoesByAluno[linha.aluno.id]?.participacao ?? ''"
                  @change="salvarAvaliacao(linha.aluno.id, 'participacao', $event.target.value)"
                />
              </td>
              <td class="p-2 font-semibold">{{ linha.notaFinal.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="alunos.length === 0" class="text-slate-500 text-sm mt-2">
          Nenhum aluno nesta turma ainda. Cadastre em "Turmas".
        </p>
      </section>
    </template>
  </div>
</template>
