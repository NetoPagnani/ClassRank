import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import HomeView from '../views/HomeView.vue'
import RankingView from '../views/RankingView.vue'
import ConquistasView from '../views/ConquistasView.vue'
import TurmasView from '../views/TurmasView.vue'
import LoginView from '../views/LoginView.vue'
import SobreView from '../views/SobreView.vue'
import PublicTurmaView from '../views/PublicTurmaView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/ranking', name: 'ranking', component: RankingView, meta: { requiresAuth: true } },
  { path: '/conquistas', name: 'conquistas', component: ConquistasView, meta: { requiresAuth: true } },
  { path: '/turmas', name: 'turmas', component: TurmasView, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/sobre', name: 'sobre', component: SobreView },
  { path: '/t/:slug', name: 'public-turma', component: PublicTurmaView, meta: { telaCheia: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) {
    return true
  }

  const authStore = useAuthStore()
  if (!authStore.user) {
    return { name: 'login' }
  }

  return true
})

export default router
