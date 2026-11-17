import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { useAuthStore } from './stores/auth.js'
import { chegouPeloLinkDeRecuperacao } from './repositories/supabaseClient.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore()
await authStore.restoreSession()

app.use(router)
if (chegouPeloLinkDeRecuperacao && authStore.user) {
  router.replace({ name: 'redefinir-senha' })
}
app.mount('#app')
