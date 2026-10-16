<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { publicRepository } from '../repositories/publicRepository.js'
import PodiumTop3 from '../components/PodiumTop3.vue'
import { classificarRanking } from '../domain/RankingPosicoes.js'
import logo from '../assets/logo.png'
import bau from '../assets/bau.png'

const route = useRoute()
const slug = route.params.slug

const turma = ref(null)
const materias = ref([])
const materiaId = ref('')
const ranking = ref([])
const conquistas = ref([])
const missao = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    turma.value = await publicRepository.getTurmaBySlug(slug)
    if (!turma.value) return
    materias.value = await publicRepository.getMateriasPublicas(slug)
    conquistas.value = await publicRepository.getConquistasPublicas(slug)
    missao.value = await publicRepository.getMissaoPublica(slug)
    if (materias.value.length > 0) materiaId.value = materias.value[0].id
  } catch (err) {
    error.value = err.message
  }
})

watch(materiaId, async () => {
  if (!materiaId.value) return
  try {
    ranking.value = await publicRepository.getRankingPublico(slug, materiaId.value)
  } catch (err) {
    error.value = err.message
  }
})

const linhasPodio = computed(() =>
  ranking.value.map((linha) => ({
    aluno: { id: linha.aluno_id, nome: linha.nome, fotoUrl: linha.foto_url },
    notaFinal: Number(linha.nota_final)
  }))
)

const linhasTabela = computed(() => classificarRanking(linhasPodio.value))
</script>

<template>
  <div class="space-y-6">
    <p v-if="!turma" class="text-xl text-slate-100">Turma não encontrada.</p>
    <template v-else>
      <div class="text-center space-y-2">
        <img :src="logo" alt="EduQuest" class="w-16 h-16 mx-auto pixel-corners" />
        <p class="font-pixel text-rank-gold text-xs">RANKING DA TURMA</p>
        <h1 class="font-pixel text-xl text-white">{{ turma.nome }}</h1>
      </div>
      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

      <div v-if="missao" class="pixel-corners pixel-panel p-4">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Missão da semana: {{ missao.titulo }}</h2>
        <p class="text-base text-slate-100">{{ missao.descricao }}</p>
        <p class="text-base">Progresso: {{ missao.progresso_atual }} / {{ missao.meta }}</p>
      </div>

      <section class="pixel-corners pixel-panel p-4 space-y-3">
        <select v-model="materiaId" class="pixel-input pixel-corners px-2 py-1 text-xl">
          <option value="">Selecione a matéria</option>
          <option v-for="materia in materias" :key="materia.id" :value="materia.id">{{ materia.nome }}</option>
        </select>

        <template v-if="materiaId">
          <PodiumTop3 v-if="linhasPodio.length > 0" :linhas="linhasPodio" />
          <p v-else class="text-slate-200 text-sm text-center">Ainda não há notas lançadas nesta matéria.</p>
          <table v-if="linhasTabela.length > 0" class="w-full text-xl">
            <thead>
              <tr class="text-left border-b border-rank-navy text-rank-gold">
                <th class="p-2 w-16">#</th>
                <th class="p-2">Aluno</th>
                <th class="p-2 text-right">Pontuação</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="linha in linhasTabela"
                :key="linha.aluno.id"
                class="border-b border-rank-navy"
                :class="linha.posicao <= 3 ? 'bg-rank-navy' : ''"
              >
                <td class="p-2">{{ linha.posicao }}º</td>
                <td class="p-2">{{ linha.aluno.nome }}</td>
                <td class="p-2 text-right font-pixel text-xs text-rank-gold">{{ linha.notaFinal.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-if="materias.length === 0" class="text-slate-200 text-sm">
          Nenhuma matéria com tarefas ainda.
        </p>
      </section>

      <section v-if="conquistas.length > 0" class="pixel-corners pixel-panel p-4">
        <h2 class="text-rank-gold text-2xl font-bold uppercase tracking-wide mb-2">Conquistas da turma</h2>
        <ul class="text-base space-y-2">
          <li v-for="(c, i) in conquistas" :key="i" class="flex items-center gap-2">
            <img :src="bau" alt="" class="w-6 h-6" /> {{ c.aluno_nome }} — {{ c.conquista_nome }}
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
