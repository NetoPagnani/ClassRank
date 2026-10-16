<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { publicRepository } from '../repositories/publicRepository.js'

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
</script>

<template>
  <div class="space-y-6">
    <p v-if="!turma" class="text-slate-600">Turma não encontrada.</p>
    <template v-else>
      <h1 class="text-2xl font-bold">{{ turma.nome }}</h1>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <div v-if="missao" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h2 class="font-semibold">Missão da semana: {{ missao.titulo }}</h2>
        <p class="text-sm text-slate-600">{{ missao.descricao }}</p>
        <p class="text-sm">Progresso: {{ missao.progresso_atual }} / {{ missao.meta }}</p>
      </div>

      <section class="bg-white rounded-lg shadow p-4 space-y-3">
        <select v-model="materiaId" class="border rounded px-2 py-1">
          <option value="">Selecione a matéria</option>
          <option v-for="materia in materias" :key="materia.id" :value="materia.id">{{ materia.nome }}</option>
        </select>

        <table v-if="materiaId" class="min-w-full text-sm">
          <thead>
            <tr class="text-left border-b">
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
              :class="index < 3 ? 'bg-amber-50 font-medium' : ''"
              class="border-b"
            >
              <td class="p-2">{{ index + 1 }}º {{ index < 3 ? '🏆' : '' }}</td>
              <td class="p-2">
                <img v-if="linha.foto_url" :src="linha.foto_url" class="w-8 h-8 rounded-full object-cover" />
              </td>
              <td class="p-2">{{ linha.nome }}</td>
              <td class="p-2">{{ Number(linha.nota_final).toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="materias.length === 0" class="text-slate-500 text-sm">Nenhuma matéria com tarefas ainda.</p>
      </section>

      <section v-if="conquistas.length > 0" class="bg-white rounded-lg shadow p-4">
        <h2 class="font-semibold mb-2">Conquistas da turma</h2>
        <ul class="text-sm space-y-1">
          <li v-for="(c, i) in conquistas" :key="i">🏅 {{ c.aluno_nome }} — {{ c.conquista_nome }}</li>
        </ul>
      </section>
    </template>
  </div>
</template>
