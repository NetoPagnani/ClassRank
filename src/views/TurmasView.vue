<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTurmasStore } from '../stores/turmas.js'
import { useMateriasStore } from '../stores/materias.js'
import { useAlunosStore } from '../stores/alunos.js'

const turmasStore = useTurmasStore()
const materiasStore = useMateriasStore()
const alunosStore = useAlunosStore()

const novaTurmaNome = ref('')
const novaMateriaNome = ref('')
const novoAlunoNome = ref('')
const turmaSelecionadaId = ref(null)

const alunosDaTurma = computed(() => alunosStore.itemsByTurma[turmaSelecionadaId.value] ?? [])

onMounted(async () => {
  await Promise.all([turmasStore.fetchAll(), materiasStore.fetchAll()])
})

async function selecionarTurma(id) {
  turmaSelecionadaId.value = id
  await alunosStore.fetchByTurma(id)
}

async function criarTurma() {
  if (!novaTurmaNome.value.trim()) return
  await turmasStore.add(novaTurmaNome.value.trim())
  novaTurmaNome.value = ''
}

async function criarMateria() {
  if (!novaMateriaNome.value.trim()) return
  await materiasStore.add(novaMateriaNome.value.trim())
  novaMateriaNome.value = ''
}

async function criarAluno() {
  if (!novoAlunoNome.value.trim() || !turmaSelecionadaId.value) return
  await alunosStore.add({ turmaId: turmaSelecionadaId.value, nome: novoAlunoNome.value.trim() })
  novoAlunoNome.value = ''
}

async function trocarFoto(alunoId, event) {
  const file = event.target.files[0]
  if (!file) return
  await alunosStore.uploadFoto(alunoId, file)
  event.target.value = ''
}

function linkPublico(slug) {
  return `${window.location.origin}/t/${slug}`
}

async function copiarLink(slug) {
  await navigator.clipboard.writeText(linkPublico(slug))
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Turmas</h1>

    <section class="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 class="font-semibold text-lg">Matérias</h2>
      <p v-if="materiasStore.error" class="text-red-600 text-sm">{{ materiasStore.error }}</p>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="materia in materiasStore.items"
          :key="materia.id"
          class="bg-slate-100 rounded px-3 py-1 text-sm"
        >
          {{ materia.nome }}
        </li>
      </ul>
      <form class="flex gap-2" @submit.prevent="criarMateria">
        <input
          v-model="novaMateriaNome"
          type="text"
          placeholder="Nova matéria (ex: Matemática)"
          class="border rounded px-2 py-1 flex-1"
        />
        <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded">Adicionar</button>
      </form>
    </section>

    <section class="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 class="font-semibold text-lg">Suas turmas</h2>
      <p v-if="turmasStore.error" class="text-red-600 text-sm">{{ turmasStore.error }}</p>
      <ul class="space-y-2">
        <li
          v-for="turma in turmasStore.items"
          :key="turma.id"
          class="border rounded p-3 flex flex-wrap items-center gap-3"
          :class="{ 'border-blue-500 bg-blue-50': turma.id === turmaSelecionadaId }"
        >
          <button class="font-medium underline" @click="selecionarTurma(turma.id)">{{ turma.nome }}</button>
          <span class="text-xs text-slate-500 break-all">{{ linkPublico(turma.slug) }}</span>
          <button class="text-xs bg-slate-200 px-2 py-1 rounded" @click="copiarLink(turma.slug)">
            Copiar link público
          </button>
        </li>
      </ul>
      <form class="flex gap-2" @submit.prevent="criarTurma">
        <input
          v-model="novaTurmaNome"
          type="text"
          placeholder="Nova turma (ex: 3º Ano TI)"
          class="border rounded px-2 py-1 flex-1"
        />
        <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded">Criar turma</button>
      </form>
    </section>

    <section v-if="turmaSelecionadaId" class="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 class="font-semibold text-lg">Alunos</h2>
      <p v-if="alunosStore.error" class="text-red-600 text-sm">{{ alunosStore.error }}</p>
      <ul class="space-y-2">
        <li v-for="aluno in alunosDaTurma" :key="aluno.id" class="flex items-center gap-3 border rounded p-2">
          <img
            v-if="aluno.fotoUrl"
            :src="aluno.fotoUrl"
            :alt="aluno.nome"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div v-else class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm">
            {{ aluno.nome.charAt(0) }}
          </div>
          <span class="flex-1">{{ aluno.nome }}</span>
          <input type="file" accept="image/*" @change="trocarFoto(aluno.id, $event)" />
        </li>
      </ul>
      <form class="flex gap-2" @submit.prevent="criarAluno">
        <input
          v-model="novoAlunoNome"
          type="text"
          placeholder="Nome do aluno"
          class="border rounded px-2 py-1 flex-1"
        />
        <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded">Adicionar aluno</button>
      </form>
    </section>
  </div>
</template>
