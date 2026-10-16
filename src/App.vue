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
  <div class="min-h-screen bg-slate-100">
    <header v-if="showNav" class="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 flex-wrap">
      <strong class="text-lg">ClassRank</strong>
      <nav class="flex gap-3 flex-1 flex-wrap">
        <RouterLink class="hover:underline" :to="{ name: 'home' }">Início</RouterLink>
        <RouterLink class="hover:underline" :to="{ name: 'ranking' }">Ranking</RouterLink>
        <RouterLink class="hover:underline" :to="{ name: 'turmas' }">Turmas</RouterLink>
        <RouterLink class="hover:underline" :to="{ name: 'conquistas' }">Conquistas</RouterLink>
        <RouterLink class="hover:underline" :to="{ name: 'sobre' }">Sobre</RouterLink>
      </nav>
      <button class="bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded" @click="handleLogout">Sair</button>
    </header>
    <main class="p-4 max-w-5xl mx-auto">
      <RouterView />
    </main>
  </div>
</template>
