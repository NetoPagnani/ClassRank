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

async function excluirTurma(turma) {
  const confirmado = window.confirm(
    `Excluir "${turma.nome}"? Isso apaga também os alunos, tarefas e notas dessa turma. Essa ação não pode ser desfeita.`
  )
  if (!confirmado) return
  await turmasStore.remove(turma.id)
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
      <h2 class="font-retro text-rank-gold text-2xl uppercase tracking-wide">Matérias</h2>
      <p v-if="materiasStore.error" class="text-red-400 text-sm font-retro">{{ materiasStore.error }}</p>
      <ul class="flex flex-wrap gap-2 font-retro text-xl">
        <li
          v-for="materia in materiasStore.items"
          :key="materia.id"
          class="pixel-corners bg-rank-navy px-3 py-1"
        >
          {{ materia.nome }}
        </li>
      </ul>
      <form class="flex gap-2 font-retro text-xl" @submit.prevent="criarMateria">
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
      <h2 class="font-retro text-rank-gold text-2xl uppercase tracking-wide">Suas turmas</h2>
      <p v-if="turmasStore.error" class="text-red-400 text-sm font-retro">{{ turmasStore.error }}</p>
      <ul class="space-y-2 font-retro text-xl">
        <li
          v-for="turma in turmasStore.items"
          :key="turma.id"
          class="pixel-corners border-2 border-rank-navy p-3 flex flex-wrap items-center gap-3"
          :class="{ 'border-rank-gold bg-rank-navy': turma.id === turmaSelecionadaId }"
        >
          <button class="text-rank-gold underline" @click="selecionarTurma(turma.id)">{{ turma.nome }}</button>
          <span class="text-sm text-slate-200 break-all">{{ linkPublico(turma.slug) }}</span>
          <button class="pixel-corners pixel-btn px-2 py-1 text-base" @click="copiarLink(turma.slug)">
            Copiar link público
          </button>
          <button
            class="pixel-corners px-2 py-1 text-base font-retro bg-red-900 border-2 border-black text-red-100 shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]"
            @click="excluirTurma(turma)"
          >
            Excluir
          </button>
        </li>
      </ul>
      <form class="flex gap-2 font-retro text-xl" @submit.prevent="criarTurma">
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
      <h2 class="font-retro text-rank-gold text-2xl uppercase tracking-wide">Alunos</h2>
      <p v-if="alunosStore.error" class="text-red-400 text-sm font-retro">{{ alunosStore.error }}</p>
      <ul class="space-y-2 font-retro text-xl">
        <li
          v-for="aluno in alunosDaTurma"
          :key="aluno.id"
          class="pixel-corners border-2 border-rank-navy p-2 flex items-center gap-3"
        >
          <img
            v-if="aluno.fotoUrl"
            :src="aluno.fotoUrl"
            :alt="aluno.nome"
            class="pixel-corners w-10 h-10 object-cover border-2 border-rank-gold shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]"
          />
          <div
            v-else
            class="pixel-corners w-10 h-10 bg-rank-navy border-2 border-rank-gold flex items-center justify-center font-pixel text-xs shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]"
          >
            {{ aluno.nome.charAt(0) }}
          </div>
          <span class="flex-1">{{ aluno.nome }}</span>
          <input type="file" accept="image/*" class="text-sm" @change="trocarFoto(aluno.id, $event)" />
        </li>
      </ul>
      <form class="flex gap-2 font-retro text-xl" @submit.prevent="criarAluno">
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
