<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTurmasStore } from '../stores/turmas.js'

const turmasStore = useTurmasStore()

onMounted(() => {
  turmasStore.fetchAll()
})

function linkPublico(slug) {
  return `${window.location.origin}/t/${slug}`
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Bem-vindo(a) ao ClassRank</h1>
    <p class="text-slate-600">Gerencie suas turmas, lance notas e acompanhe o ranking dos alunos.</p>

    <div class="grid sm:grid-cols-3 gap-4">
      <RouterLink :to="{ name: 'turmas' }" class="bg-white rounded-lg shadow p-4 hover:shadow-md">
        <h2 class="font-semibold">Turmas</h2>
        <p class="text-sm text-slate-500">{{ turmasStore.items.length }} turma(s) cadastrada(s)</p>
      </RouterLink>
      <RouterLink :to="{ name: 'ranking' }" class="bg-white rounded-lg shadow p-4 hover:shadow-md">
        <h2 class="font-semibold">Ranking</h2>
        <p class="text-sm text-slate-500">Lançar notas e ver o ranking</p>
      </RouterLink>
      <RouterLink :to="{ name: 'conquistas' }" class="bg-white rounded-lg shadow p-4 hover:shadow-md">
        <h2 class="font-semibold">Conquistas</h2>
        <p class="text-sm text-slate-500">Veja as conquistas desbloqueadas</p>
      </RouterLink>
    </div>

    <section v-if="turmasStore.items.length > 0" class="bg-white rounded-lg shadow p-4">
      <h2 class="font-semibold mb-2">Links públicos das turmas</h2>
      <ul class="text-sm space-y-1">
        <li v-for="turma in turmasStore.items" :key="turma.id">
          {{ turma.nome }} — <code class="text-xs">{{ linkPublico(turma.slug) }}</code>
        </li>
      </ul>
    </section>
  </div>
</template>
