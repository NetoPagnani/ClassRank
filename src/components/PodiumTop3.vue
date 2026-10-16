<script setup>
import { avatarPadrao } from '../utils/avatarPadrao.js'

defineProps({
  linhas: { type: Array, required: true } // [{ aluno: {nome, fotoUrl}, notaFinal }], já ordenado desc
})

const ORDEM_PODIO = [1, 0, 2] // 2º, 1º, 3º — o 1º lugar fica mais alto, no centro
const ALTURAS = { 0: 'h-28', 1: 'h-20', 2: 'h-14' }
const CORES = { 0: 'bg-rank-gold', 1: 'bg-rank-silver', 2: 'bg-rank-bronze' }
const BORDAS = { 0: 'border-rank-gold', 1: 'border-rank-silver', 2: 'border-rank-bronze' }
const COROAS = { 0: '👑', 1: '🥈', 2: '🥉' }
</script>

<template>
  <div class="flex items-end justify-center gap-4 py-6">
    <template v-for="posicao in ORDEM_PODIO" :key="posicao">
      <div v-if="linhas[posicao]" class="flex flex-col items-center gap-2 w-28">
        <span class="text-2xl">{{ COROAS[posicao] }}</span>
        <div
          class="pixel-corners w-16 h-16 border-4 bg-rank-navyLight overflow-hidden flex items-center justify-center font-pixel text-xs shadow-[3px_3px_0_0_rgba(0,0,0,0.45)]"
          :class="BORDAS[posicao]"
        >
          <img
            :src="linhas[posicao].aluno.fotoUrl || avatarPadrao(linhas[posicao].aluno.id)"
            :alt="linhas[posicao].aluno.nome"
            class="w-full h-full object-cover"
          />
        </div>
        <span class="text-base text-center leading-tight truncate w-full">{{
          linhas[posicao].aluno.nome
        }}</span>
        <span class="font-pixel text-sm text-rank-gold">{{ linhas[posicao].notaFinal.toFixed(1) }}</span>
        <div
          class="pixel-corners w-full flex items-center justify-center font-pixel text-xl text-rank-navyDark"
          :class="[ALTURAS[posicao], CORES[posicao]]"
        >
          {{ posicao + 1 }}º
        </div>
      </div>
    </template>
  </div>
</template>
