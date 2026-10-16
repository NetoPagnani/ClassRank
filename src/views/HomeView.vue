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
    <div class="pixel-corners pixel-panel p-6 text-center space-y-2">
      <h1 class="font-pixel text-rank-gold text-lg">Bem-vindo(a) ao EduQuest</h1>
      <p class="text-xl text-slate-100">
        Gerencie suas turmas, lance notas e acompanhe o ranking dos alunos.
      </p>
    </div>

    <div class="grid sm:grid-cols-3 gap-4">
      <RouterLink :to="{ name: 'turmas' }" class="pixel-corners pixel-panel p-4 hover:brightness-125">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Turmas</h2>
        <p class="text-xl text-slate-100">{{ turmasStore.items.length }} turma(s) cadastrada(s)</p>
      </RouterLink>
      <RouterLink :to="{ name: 'ranking' }" class="pixel-corners pixel-panel p-4 hover:brightness-125">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Ranking</h2>
        <p class="text-xl text-slate-100">Lançar notas e ver o ranking</p>
      </RouterLink>
      <RouterLink :to="{ name: 'conquistas' }" class="pixel-corners pixel-panel p-4 hover:brightness-125">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Conquistas</h2>
        <p class="text-xl text-slate-100">Veja as conquistas desbloqueadas</p>
      </RouterLink>
    </div>

    <section v-if="turmasStore.items.length > 0" class="pixel-corners pixel-panel p-4">
      <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Links públicos das turmas</h2>
      <ul class="text-xl space-y-1">
        <li v-for="turma in turmasStore.items" :key="turma.id">
          {{ turma.nome }} — <code class="text-sm text-rank-gold">{{ linkPublico(turma.slug) }}</code>
        </li>
      </ul>
    </section>
  </div>
</template>
