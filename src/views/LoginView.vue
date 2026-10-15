<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

async function handleSubmit() {
  await authStore.signIn(email.value, password.value)
  if (authStore.user) {
    router.push('/')
  }
}
</script>

<template>
  <div>
    <h1>Entrar</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">E-mail</label>
        <input id="email" v-model="email" type="email" required autocomplete="email" />
      </div>
      <div>
        <label for="password">Senha</label>
        <input id="password" v-model="password" type="password" required autocomplete="current-password" />
      </div>
      <button type="submit" :disabled="authStore.loading">Entrar</button>
    </form>
    <p v-if="authStore.error">{{ authStore.error }}</p>
  </div>
</template>
