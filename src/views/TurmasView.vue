<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useTurmasStore } from '../stores/turmas.js'
import { useMateriasStore } from '../stores/materias.js'
import { useAlunosStore } from '../stores/alunos.js'
import { useMissoesStore } from '../stores/missoes.js'

const turmasStore = useTurmasStore()
const materiasStore = useMateriasStore()
const alunosStore = useAlunosStore()
const missoesStore = useMissoesStore()

const novaTurmaNome = ref('')
const novaMateriaNome = ref('')
const novoAlunoNome = ref('')
const turmaSelecionadaId = ref(null)

const alunosDaTurma = computed(() => alunosStore.itemsByTurma[turmaSelecionadaId.value] ?? [])

function inicioDaSemana() {
  const hoje = new Date()
  const dia = hoje.getDay()
  const diff = (dia === 0 ? -6 : 1) - dia
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + diff)
  return segunda.toISOString().slice(0, 10)
}

const semanaAtual = inicioDaSemana()
const missaoForm = ref({ titulo: '', descricao: '', meta: 5, progressoAtual: 0 })

const missaoDaSemana = computed(() =>
  (missoesStore.itemsByTurma[turmaSelecionadaId.value] ?? []).find(
    (m) => m.semanaReferencia === semanaAtual
  )
)

watch(missaoDaSemana, (missao) => {
  missaoForm.value = missao
    ? { titulo: missao.titulo, descricao: missao.descricao ?? '', meta: missao.meta, progressoAtual: missao.progressoAtual }
    : { titulo: '', descricao: '', meta: 5, progressoAtual: 0 }
})

async function salvarMissao() {
  if (!missaoForm.value.titulo.trim() || !turmaSelecionadaId.value) return
  await missoesStore.upsert({
    turmaId: turmaSelecionadaId.value,
    titulo: missaoForm.value.titulo.trim(),
    descricao: missaoForm.value.descricao.trim() || null,
    meta: Number(missaoForm.value.meta),
    progressoAtual: Number(missaoForm.value.progressoAtual),
    semanaReferencia: semanaAtual
  })
}

async function selecionarTurma(id) {
  turmaSelecionadaId.value = id
  await alunosStore.fetchByTurma(id)
  await missoesStore.fetchByTurma(id)
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

async function excluirMateria(materia) {
  const confirmado = window.confirm(
    `Excluir a matéria "${materia.nome}"? Isso apaga também as tarefas, notas e avaliações lançadas nela. Essa ação não pode ser desfeita.`
  )
  if (!confirmado) return
  await materiasStore.remove(materia.id)
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
      <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide">Matérias</h2>
      <p v-if="materiasStore.error" class="text-red-400 text-sm">{{ materiasStore.error }}</p>
      <ul class="flex flex-wrap gap-2 text-xl">
        <li
          v-for="materia in materiasStore.items"
          :key="materia.id"
          class="pixel-corners bg-rank-navy px-3 py-1 flex items-center gap-2"
        >
          {{ materia.nome }}
          <button
            class="pixel-corners px-2 text-base bg-red-900 border-2 border-black text-red-100"
            @click="excluirMateria(materia)"
          >
            Excluir
          </button>
        </li>
      </ul>
      <form class="flex gap-2 text-xl" @submit.prevent="criarMateria">
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
      <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide">Suas turmas</h2>
      <p v-if="turmasStore.error" class="text-red-400 text-sm">{{ turmasStore.error }}</p>
      <ul class="space-y-2 text-xl">
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
            class="pixel-corners px-2 py-1 text-base bg-red-900 border-2 border-black text-red-100 shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]"
            @click="excluirTurma(turma)"
          >
            Excluir
          </button>
        </li>
      </ul>
      <form class="flex gap-2 text-xl" @submit.prevent="criarTurma">
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
      <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide">Alunos</h2>
      <p v-if="alunosStore.error" class="text-red-400 text-sm">{{ alunosStore.error }}</p>
      <ul class="space-y-2 text-xl">
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
      <form class="flex gap-2 text-xl" @submit.prevent="criarAluno">
        <input
          v-model="novoAlunoNome"
          type="text"
          placeholder="Nome do aluno"
          class="pixel-input pixel-corners px-2 py-1 flex-1"
        />
        <button type="submit" class="pixel-corners pixel-btn px-3 py-2">Adicionar aluno</button>
      </form>
    </section>

    <section v-if="turmaSelecionadaId" class="pixel-corners pixel-panel p-4 space-y-3">
      <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide">📜 Missão da semana</h2>
      <p v-if="missoesStore.error" class="text-red-400 text-sm">{{ missoesStore.error }}</p>
      <div v-if="missaoDaSemana" class="pixel-corners border-2 border-rank-gold p-3">
        <div class="h-4 w-full bg-rank-navy pixel-corners overflow-hidden">
          <div
            class="h-full bg-green-500"
            :style="{
              width: Math.min(100, (missaoDaSemana.progressoAtual / missaoDaSemana.meta) * 100) + '%'
            }"
          ></div>
        </div>
        <p class="text-sm text-slate-200 mt-1">
          {{ missaoDaSemana.progressoAtual }} / {{ missaoDaSemana.meta }}
        </p>
      </div>
      <form class="flex flex-wrap gap-2 items-end text-xl" @submit.prevent="salvarMissao">
        <input
          v-model="missaoForm.titulo"
          type="text"
          placeholder="Título da missão (ex: Entregar todas as tarefas)"
          class="pixel-input pixel-corners px-2 py-1 flex-1"
        />
        <input
          v-model="missaoForm.descricao"
          type="text"
          placeholder="Descrição (opcional)"
          class="pixel-input pixel-corners px-2 py-1 flex-1"
        />
        <input v-model="missaoForm.meta" type="number" min="1" step="1" placeholder="Meta" class="pixel-input pixel-corners px-2 py-1 w-24" />
        <input
          v-model="missaoForm.progressoAtual"
          type="number"
          min="0"
          step="1"
          placeholder="Progresso"
          class="pixel-input pixel-corners px-2 py-1 w-28"
        />
        <button type="submit" class="pixel-corners pixel-btn px-3 py-2">Salvar missão</button>
      </form>
    </section>
  </div>
</template>
