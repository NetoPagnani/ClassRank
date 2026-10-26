<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import logo from '../assets/logo.png'
import PasswordInput from '../components/PasswordInput.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const modo = ref('entrar')

const TITULOS = { entrar: 'Entrar', cadastrar: 'Criar conta de professor', recuperar: 'Recuperar senha' }
const BOTOES = { entrar: 'Entrar', cadastrar: 'Criar conta', recuperar: 'Enviar link' }

async function handleSubmit() {
  if (modo.value === 'recuperar') {
    await authStore.requestPasswordReset(email.value)
    return
  }
  if (modo.value === 'entrar') {
    await authStore.signIn(email.value, password.value)
  } else {
    await authStore.signUp(email.value, password.value)
  }
  if (authStore.user) {
    router.push({ name: 'home' })
  }
}

function irPara(novoModo) {
  modo.value = novoModo
  authStore.error = null
  authStore.message = null
}
</script>

<template>
  <div class="max-w-sm mx-auto mt-16 pixel-corners pixel-panel p-6 space-y-4">
    <div class="flex flex-col items-center gap-2">
      <img :src="logo" alt="EduQuest" class="w-20 h-20 pixel-corners" />
      <p class="font-pixel text-rank-gold text-xs text-center">EDUQUEST</p>
    </div>
    <h1 class="text-xl font-bold text-white text-center">
      {{ TITULOS[modo] }}
    </h1>
    <p v-if="modo === 'recuperar'" class="text-base text-slate-200 text-center">
      Digite seu e-mail institucional. Vamos mandar um link para você criar uma senha nova.
    </p>
    <form class="space-y-3 text-xl" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="block text-sm font-bold text-rank-gold mb-1">E-mail institucional</label>
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
      <div v-if="modo !== 'recuperar'">
        <label for="password" class="block text-sm font-bold text-rank-gold mb-1">Senha</label>
        <PasswordInput
          id="password"
          v-model="password"
          :required="modo !== 'recuperar'"
          :autocomplete="modo === 'cadastrar' ? 'new-password' : 'current-password'"
          minlength="6"
        />
      </div>
      <button type="submit" :disabled="authStore.loading" class="w-full pixel-corners pixel-btn py-2 disabled:opacity-50">
        {{ BOTOES[modo] }}
      </button>
    </form>
    <p v-if="authStore.error" class="text-red-400 text-sm">{{ authStore.error }}</p>
    <p v-if="authStore.message" class="text-green-400 text-sm">{{ authStore.message }}</p>
    <div class="flex flex-col items-start gap-2">
      <button v-if="modo === 'entrar'" class="text-sm text-rank-gold underline" @click="irPara('recuperar')">
        Esqueci minha senha
      </button>
      <button v-if="modo === 'entrar'" class="text-sm text-rank-gold underline" @click="irPara('cadastrar')">
        Ainda não tem conta? Criar conta
      </button>
      <button v-else class="text-sm text-rank-gold underline" @click="irPara('entrar')">
        Voltar para o login
      </button>
    </div>
  </div>
</template>
