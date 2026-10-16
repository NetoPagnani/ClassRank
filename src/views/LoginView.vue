<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const modo = ref('entrar')

async function handleSubmit() {
  if (modo.value === 'entrar') {
    await authStore.signIn(email.value, password.value)
  } else {
    await authStore.signUp(email.value, password.value)
  }
  if (authStore.user) {
    router.push({ name: 'home' })
  }
}

function alternarModo() {
  modo.value = modo.value === 'entrar' ? 'cadastrar' : 'entrar'
  authStore.error = null
  authStore.message = null
}
</script>

<template>
  <div class="max-w-sm mx-auto mt-16 pixel-corners pixel-panel p-6 space-y-4">
    <p class="font-pixel text-rank-gold text-xs text-center">🏆 CLASSRANK</p>
    <h1 class="font-pixel text-base text-white text-center">
      {{ modo === 'entrar' ? 'Entrar' : 'Criar conta de professor' }}
    </h1>
    <form class="space-y-3 font-retro text-xl" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="block text-sm font-pixel text-rank-gold mb-1">E-mail institucional</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="voce@professor.educacao.sp.gov.br"
          class="w-full pixel-input pixel-corners px-2 py-1"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-pixel text-rank-gold mb-1">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          minlength="6"
          class="w-full pixel-input pixel-corners px-2 py-1"
        />
      </div>
      <button type="submit" :disabled="authStore.loading" class="w-full pixel-corners pixel-btn py-2 disabled:opacity-50">
        {{ modo === 'entrar' ? 'Entrar' : 'Criar conta' }}
      </button>
    </form>
    <p v-if="authStore.error" class="text-red-400 text-sm font-retro">{{ authStore.error }}</p>
    <p v-if="authStore.message" class="text-green-400 text-sm font-retro">{{ authStore.message }}</p>
    <button class="text-sm text-rank-gold underline font-retro" @click="alternarModo">
      {{ modo === 'entrar' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Entrar' }}
    </button>
  </div>
</template>
