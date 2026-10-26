<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import logo from '../assets/logo.png'
import PasswordInput from '../components/PasswordInput.vue'

// Tela aberta pelo link do e-mail "Recuperar senha": o link já deixa o professor
// com uma sessão de recuperação, então basta gravar a senha nova
const authStore = useAuthStore()
const router = useRouter()

const senha = ref('')
const confirmacao = ref('')
const erroLocal = ref(null)
const concluido = ref(false)

async function salvar() {
  erroLocal.value = null
  if (senha.value !== confirmacao.value) {
    erroLocal.value = 'As duas senhas não são iguais.'
    return
  }
  concluido.value = await authStore.updatePassword(senha.value)
  if (concluido.value) setTimeout(() => router.push({ name: 'home' }), 2000)
}
</script>

<template>
  <div class="max-w-sm mx-auto mt-16 pixel-corners pixel-panel p-6 space-y-4">
    <div class="flex flex-col items-center gap-2">
      <img :src="logo" alt="EduQuest" class="w-20 h-20 pixel-corners" />
      <p class="font-pixel text-rank-gold text-xs text-center">EDUQUEST</p>
    </div>
    <h1 class="text-xl font-bold text-white text-center">Criar nova senha</h1>

    <template v-if="!authStore.user && !concluido">
      <p class="text-base text-slate-200">
        Este link de recuperação é inválido ou já expirou. Peça um novo na tela de login, em "Esqueci minha senha".
      </p>
      <RouterLink :to="{ name: 'login' }" class="text-sm text-rank-gold underline">Ir para o login</RouterLink>
    </template>

    <p v-else-if="concluido" class="text-green-400 text-base">Senha alterada! Entrando no EduQuest...</p>

    <form v-else class="space-y-3 text-xl" @submit.prevent="salvar">
      <div>
        <label for="senha" class="block text-sm font-bold text-rank-gold mb-1">Nova senha</label>
        <PasswordInput id="senha" v-model="senha" required minlength="6" autocomplete="new-password" />
      </div>
      <div>
        <label for="confirmacao" class="block text-sm font-bold text-rank-gold mb-1">Repita a nova senha</label>
        <PasswordInput id="confirmacao" v-model="confirmacao" required minlength="6" autocomplete="new-password" />
      </div>
      <button type="submit" :disabled="authStore.loading" class="w-full pixel-corners pixel-btn py-2 disabled:opacity-50">
        Salvar nova senha
      </button>
      <p v-if="erroLocal || authStore.error" class="text-red-400 text-sm">{{ erroLocal || authStore.error }}</p>
    </form>
  </div>
</template>
