<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const showNav = computed(() => authStore.user && route.meta.requiresAuth)

async function handleLogout() {
  await authStore.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen">
    <header
      v-if="showNav"
      class="bg-rank-navyDark border-b-4 border-black px-4 py-3 flex items-center gap-6 flex-wrap"
    >
      <strong class="font-pixel text-rank-gold text-sm">EduQuest</strong>
      <nav class="flex gap-5 flex-1 flex-wrap text-lg">
        <RouterLink
          class="text-slate-200 hover:text-rank-gold transition-colors"
          active-class="text-rank-gold border-b-2 border-rank-gold"
          :to="{ name: 'home' }"
        >
          Início
        </RouterLink>
        <RouterLink
          class="text-slate-200 hover:text-rank-gold transition-colors"
          active-class="text-rank-gold border-b-2 border-rank-gold"
          :to="{ name: 'ranking' }"
        >
          Ranking
        </RouterLink>
        <RouterLink
          class="text-slate-200 hover:text-rank-gold transition-colors"
          active-class="text-rank-gold border-b-2 border-rank-gold"
          :to="{ name: 'turmas' }"
        >
          Turmas
        </RouterLink>
        <RouterLink
          class="text-slate-200 hover:text-rank-gold transition-colors"
          active-class="text-rank-gold border-b-2 border-rank-gold"
          :to="{ name: 'conquistas' }"
        >
          Conquistas
        </RouterLink>
        <RouterLink
          class="text-slate-200 hover:text-rank-gold transition-colors"
          active-class="text-rank-gold border-b-2 border-rank-gold"
          :to="{ name: 'sobre' }"
        >
          Sobre
        </RouterLink>
      </nav>
      <button class="pixel-corners pixel-btn px-3 py-2" @click="handleLogout">Sair</button>
    </header>
    <main class="p-4 max-w-5xl mx-auto">
      <RouterView />
    </main>
  </div>
</template>
