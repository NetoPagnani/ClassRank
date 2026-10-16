<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useTurmasStore } from '../stores/turmas.js'
import { useAlunosStore } from '../stores/alunos.js'
import { useConquistasStore } from '../stores/conquistas.js'

const turmasStore = useTurmasStore()
const alunosStore = useAlunosStore()
const conquistasStore = useConquistasStore()

const turmaId = ref('')
const alunoId = ref('')

const alunos = computed(() => alunosStore.itemsByTurma[turmaId.value] ?? [])
const conquistasDoAluno = computed(() => conquistasStore.byAluno[alunoId.value] ?? [])

onMounted(async () => {
  await Promise.all([turmasStore.fetchAll(), conquistasStore.fetchCatalogo()])
})

watch(turmaId, async () => {
  alunoId.value = ''
  if (turmaId.value) await alunosStore.fetchByTurma(turmaId.value)
})

watch(alunoId, async () => {
  if (alunoId.value) await conquistasStore.fetchByAluno(alunoId.value)
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-pixel text-rank-gold text-lg">Conquistas</h1>

    <section class="pixel-corners pixel-panel p-4">
      <h2 class="font-pixel text-rank-gold text-xs mb-3">Catálogo</h2>
      <ul class="grid sm:grid-cols-3 gap-3 font-retro text-lg">
        <li v-for="c in conquistasStore.catalogo" :key="c.id" class="pixel-corners border-2 border-rank-navy p-3">
          <strong class="text-rank-gold">🏅 {{ c.nome }}</strong>
          <p class="text-slate-300 text-base">{{ c.descricao }}</p>
        </li>
      </ul>
    </section>

    <section class="pixel-corners pixel-panel p-4 space-y-3">
      <h2 class="font-pixel text-rank-gold text-xs">Ver conquistas de um aluno</h2>
      <div class="flex gap-2 font-retro text-lg">
        <select v-model="turmaId" class="pixel-input pixel-corners px-2 py-1">
          <option value="">Turma</option>
          <option v-for="turma in turmasStore.items" :key="turma.id" :value="turma.id">{{ turma.nome }}</option>
        </select>
        <select v-model="alunoId" class="pixel-input pixel-corners px-2 py-1">
          <option value="">Aluno</option>
          <option v-for="aluno in alunos" :key="aluno.id" :value="aluno.id">{{ aluno.nome }}</option>
        </select>
      </div>
      <ul v-if="alunoId" class="font-retro text-lg space-y-1">
        <li v-if="conquistasDoAluno.length === 0" class="text-slate-400">Nenhuma conquista ainda.</li>
        <li v-for="item in conquistasDoAluno" :key="item.conquista_id">🏅 {{ item.conquistas?.nome }}</li>
      </ul>
    </section>
  </div>
</template>
