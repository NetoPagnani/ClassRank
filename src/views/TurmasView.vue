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
    <h1 class="font-pixel text-rank-gold text-lg">Turmas</h1>

    <section class="pixel-corners pixel-panel p-4 space-y-3">
      <h2 class="font-pixel text-rank-gold text-xs">Matérias</h2>
      <p v-if="materiasStore.error" class="text-red-400 text-sm font-retro">{{ materiasStore.error }}</p>
      <ul class="flex flex-wrap gap-2 font-retro text-lg">
        <li
          v-for="materia in materiasStore.items"
          :key="materia.id"
          class="pixel-corners bg-rank-navy px-3 py-1"
        >
          {{ materia.nome }}
        </li>
      </ul>
      <form class="flex gap-2 font-retro text-lg" @submit.prevent="criarMateria">
        <input
          v-model="novaMateriaNome"
          type="text"
          placeholder="Nova matéria (ex: Matemática)"
          class="pixel-input pixel-corners px-2 py-1 flex-1"
        />
        <button type="submit" class="pixel-corners pixel-btn px-3 py-2">Adicionar</button>
      </form>
    </section>

    <section class="pixel-corners pixel-panel p-4 space-y-3">
      <h2 class="font-pixel text-rank-gold text-xs">Suas turmas</h2>
      <p v-if="turmasStore.error" class="text-red-400 text-sm font-retro">{{ turmasStore.error }}</p>
      <ul class="space-y-2 font-retro text-lg">
        <li
          v-for="turma in turmasStore.items"
          :key="turma.id"
          class="pixel-corners border-2 border-rank-navy p-3 flex flex-wrap items-center gap-3"
          :class="{ 'border-rank-gold bg-rank-navy': turma.id === turmaSelecionadaId }"
        >
          <button class="text-rank-gold underline" @click="selecionarTurma(turma.id)">{{ turma.nome }}</button>
          <span class="text-sm text-slate-400 break-all">{{ linkPublico(turma.slug) }}</span>
          <button class="pixel-corners pixel-btn text-[0.55rem] px-2 py-1" @click="copiarLink(turma.slug)">
            Copiar link público
          </button>
        </li>
      </ul>
      <form class="flex gap-2 font-retro text-lg" @submit.prevent="criarTurma">
        <input
          v-model="novaTurmaNome"
          type="text"
          placeholder="Nova turma (ex: 3º Ano TI)"
          class="pixel-input pixel-corners px-2 py-1 flex-1"
        />
        <button type="submit" class="pixel-corners pixel-btn px-3 py-2">Criar turma</button>
      </form>
    </section>

    <section v-if="turmaSelecionadaId" class="pixel-corners pixel-panel p-4 space-y-3">
      <h2 class="font-pixel text-rank-gold text-xs">Alunos</h2>
      <p v-if="alunosStore.error" class="text-red-400 text-sm font-retro">{{ alunosStore.error }}</p>
      <ul class="space-y-2 font-retro text-lg">
        <li
          v-for="aluno in alunosDaTurma"
          :key="aluno.id"
          class="pixel-corners border-2 border-rank-navy p-2 flex items-center gap-3"
        >
          <img
            v-if="aluno.fotoUrl"
            :src="aluno.fotoUrl"
            :alt="aluno.nome"
            class="w-10 h-10 rounded-full object-cover border-2 border-rank-gold"
          />
          <div
            v-else
            class="w-10 h-10 rounded-full bg-rank-navy border-2 border-rank-gold flex items-center justify-center font-pixel text-xs"
          >
            {{ aluno.nome.charAt(0) }}
          </div>
          <span class="flex-1">{{ aluno.nome }}</span>
          <input type="file" accept="image/*" class="text-sm" @change="trocarFoto(aluno.id, $event)" />
        </li>
      </ul>
      <form class="flex gap-2 font-retro text-lg" @submit.prevent="criarAluno">
        <input
          v-model="novoAlunoNome"
          type="text"
          placeholder="Nome do aluno"
          class="pixel-input pixel-corners px-2 py-1 flex-1"
        />
        <button type="submit" class="pixel-corners pixel-btn px-3 py-2">Adicionar aluno</button>
      </form>
    </section>
  </div>
</template>
