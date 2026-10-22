<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTurmasStore } from '../stores/turmas.js'
import cenarioFundo from '../assets/cenario-fundo.png'

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
    <div
      class="pixel-corners border-4 border-black p-6 text-center space-y-2 bg-cover bg-center shadow-[4px_4px_0_0_rgba(0,0,0,0.45)]"
      :style="{ backgroundImage: `linear-gradient(rgba(11,21,38,0.55), rgba(11,21,38,0.55)), url(${cenarioFundo})` }"
    >
      <h1 class="font-pixel text-rank-gold text-lg drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
        Bem-vindo(a) ao EduQuest
      </h1>
      <p class="text-xl text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
        Gerencie suas turmas, lance notas e acompanhe o ranking dos alunos.
      </p>
    </div>

    <div class="grid sm:grid-cols-2 gap-4">
      <RouterLink :to="{ name: 'turmas' }" class="pixel-corners pixel-panel p-4 hover:brightness-125">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Turmas</h2>
        <p class="text-xl text-slate-100">{{ turmasStore.items.length }} turma(s) cadastrada(s)</p>
      </RouterLink>
      <RouterLink :to="{ name: 'ranking' }" class="pixel-corners pixel-panel p-4 hover:brightness-125">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Ranking</h2>
        <p class="text-xl text-slate-100">Lançar notas e ver o ranking</p>
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
