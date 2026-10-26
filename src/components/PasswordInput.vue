<script setup>
import { ref } from 'vue'

// Campo de senha com botão de olho para mostrar/esconder o que foi digitado
const model = defineModel({ type: String, default: '' })
defineOptions({ inheritAttrs: false })

const visivel = ref(false)
</script>

<template>
  <div class="relative">
    <input
      v-bind="$attrs"
      v-model="model"
      :type="visivel ? 'text' : 'password'"
      class="w-full pixel-input pixel-corners pl-2 pr-10 py-1"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex items-center px-2 text-slate-300 hover:text-rank-gold"
      :aria-label="visivel ? 'Esconder senha' : 'Mostrar senha'"
      :title="visivel ? 'Esconder senha' : 'Mostrar senha'"
      :aria-pressed="visivel"
      @click="visivel = !visivel"
    >
      <svg v-if="!visivel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    </button>
  </div>
</template>
