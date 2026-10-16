<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { publicRepository } from '../repositories/publicRepository.js'
import PodiumTop3 from '../components/PodiumTop3.vue'

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
    aluno: { nome: linha.nome, fotoUrl: linha.foto_url },
    notaFinal: Number(linha.nota_final)
  }))
)
</script>

<template>
  <div class="space-y-6">
    <p v-if="!turma" class="font-retro text-lg text-slate-300">Turma não encontrada.</p>
    <template v-else>
      <div class="text-center space-y-1">
        <p class="font-pixel text-rank-gold text-[0.6rem]">🏆 RANKING DA TURMA</p>
        <h1 class="font-pixel text-xl text-white">{{ turma.nome }}</h1>
      </div>
      <p v-if="error" class="text-red-400 text-sm font-retro">{{ error }}</p>

      <div v-if="missao" class="pixel-corners pixel-panel p-4">
        <h2 class="font-pixel text-rank-gold text-xs mb-2">Missão da semana: {{ missao.titulo }}</h2>
        <p class="text-base font-retro text-slate-300">{{ missao.descricao }}</p>
        <p class="text-base font-retro">Progresso: {{ missao.progresso_atual }} / {{ missao.meta }}</p>
      </div>

      <section class="pixel-corners pixel-panel p-4 space-y-3">
        <select v-model="materiaId" class="pixel-input pixel-corners px-2 py-1 font-retro text-lg">
          <option value="">Selecione a matéria</option>
          <option v-for="materia in materias" :key="materia.id" :value="materia.id">{{ materia.nome }}</option>
        </select>

        <template v-if="materiaId">
          <PodiumTop3 v-if="linhasPodio.length > 0" :linhas="linhasPodio" />

          <table class="min-w-full text-sm font-retro text-lg">
            <thead>
              <tr class="text-left border-b border-rank-navy text-rank-gold">
                <th class="p-2">#</th>
                <th class="p-2">Foto</th>
                <th class="p-2">Aluno</th>
                <th class="p-2">Nota final</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(linha, index) in ranking"
                :key="linha.aluno_id"
                :class="index < 3 ? 'bg-rank-navy' : ''"
                class="border-b border-rank-navy"
              >
                <td class="p-2">{{ index + 1 }}º {{ index < 3 ? '🏆' : '' }}</td>
                <td class="p-2">
                  <img v-if="linha.foto_url" :src="linha.foto_url" class="w-8 h-8 rounded-full object-cover" />
                </td>
                <td class="p-2">{{ linha.nome }}</td>
                <td class="p-2 font-pixel text-xs text-rank-gold">{{ Number(linha.nota_final).toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-if="materias.length === 0" class="text-slate-400 text-sm font-retro">
          Nenhuma matéria com tarefas ainda.
        </p>
      </section>

      <section v-if="conquistas.length > 0" class="pixel-corners pixel-panel p-4">
        <h2 class="font-pixel text-rank-gold text-xs mb-2">Conquistas da turma</h2>
        <ul class="text-base font-retro space-y-1">
          <li v-for="(c, i) in conquistas" :key="i">🏅 {{ c.aluno_nome }} — {{ c.conquista_nome }}</li>
        </ul>
      </section>
    </template>
  </div>
</template>
