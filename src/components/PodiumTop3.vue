<script setup>
import { computed } from 'vue'
import { avatarPadrao } from '../utils/avatarPadrao.js'
import { agruparPodio } from '../domain/RankingPosicoes.js'

const props = defineProps({
  linhas: { type: Array, required: true } // [{ aluno: {nome, fotoUrl}, notaFinal }]
})

const ORDEM_PODIO = [1, 0, 2] // 2º, 1º, 3º — o 1º lugar fica mais alto, no centro
const ALTURAS = { 0: 'h-28', 1: 'h-20', 2: 'h-14' }
const CORES = { 0: 'bg-rank-gold', 1: 'bg-rank-silver', 2: 'bg-rank-bronze' }
const BORDAS = { 0: 'border-rank-gold', 1: 'border-rank-silver', 2: 'border-rank-bronze' }
const COROAS = { 0: '👑', 1: '🥈', 2: '🥉' }
const MAX_AVATARES = 4 // empate grande: mostra 4 rostos e "+N"; a lista completa fica na tabela

// Empatados dividem o mesmo degrau
const grupos = computed(() => agruparPodio(props.linhas))
</script>

<template>
  <div class="flex items-end justify-center gap-2 sm:gap-4 py-6">
    <template v-for="indice in ORDEM_PODIO" :key="indice">
      <div v-if="grupos[indice]" class="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-36">
        <span class="text-2xl">{{ COROAS[indice] }}</span>
        <div class="flex flex-wrap justify-center gap-1">
          <div
            v-for="linha in grupos[indice].linhas.slice(0, MAX_AVATARES)"
            :key="linha.aluno.id"
            class="pixel-corners bg-rank-navyLight overflow-hidden flex items-center justify-center font-pixel text-xs shadow-[3px_3px_0_0_rgba(0,0,0,0.45)]"
            :class="[BORDAS[indice], grupos[indice].linhas.length > 1 ? 'w-9 h-9 sm:w-11 sm:h-11 border-2 sm:border-4' : 'w-16 h-16 border-4']"
          >
            <img
              :src="linha.aluno.fotoUrl || avatarPadrao(linha.aluno.nome)"
              :alt="linha.aluno.nome"
              class="w-full h-full object-cover"
            />
          </div>
          <span
            v-if="grupos[indice].linhas.length > MAX_AVATARES"
            class="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center font-pixel text-xs text-rank-gold"
          >
            +{{ grupos[indice].linhas.length - MAX_AVATARES }}
          </span>
        </div>
        <span class="text-sm sm:text-base text-center leading-tight w-full break-words">
          {{ grupos[indice].linhas.map((l) => l.aluno.nome).join(', ') }}
        </span>
        <span v-if="grupos[indice].linhas.length > 1" class="text-sm text-slate-200">empate</span>
        <span class="font-pixel text-sm text-rank-gold">{{ Number(grupos[indice].notaFinal).toFixed(1) }}</span>
        <div
          class="pixel-corners w-full flex items-center justify-center font-pixel text-xl text-rank-navyDark"
          :class="[ALTURAS[indice], CORES[indice]]"
        >
          {{ grupos[indice].posicao }}º
        </div>
      </div>
    </template>
  </div>
</template>
