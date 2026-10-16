import { defineStore } from 'pinia'
import { ref } from 'vue'
import { missoesRepository } from '../repositories/missoesRepository.js'

function normalizeMissao(row) {
  return {
    ...row,
    turmaId: row.turmaId ?? row.turma_id,
    progressoAtual: row.progressoAtual ?? row.progresso_atual ?? 0,
    semanaReferencia: row.semanaReferencia ?? row.semana_referencia
  }
}

export const useMissoesStore = defineStore('missoes', () => {
  const itemsByTurma = ref({})
  const error = ref(null)

  async function fetchByTurma(turmaId) {
    error.value = null
    try {
      itemsByTurma.value[turmaId] = (await missoesRepository.getByTurma(turmaId)).map(normalizeMissao)
    } catch (err) {
      error.value = err.message
    }
  }

  async function upsert({ turmaId, titulo, descricao, meta, progressoAtual, semanaReferencia }) {
    error.value = null
    try {
      await missoesRepository.upsert({ turmaId, titulo, descricao, meta, progressoAtual, semanaReferencia })
      await fetchByTurma(turmaId)
    } catch (err) {
      error.value = err.message
    }
  }

  return { itemsByTurma, error, fetchByTurma, upsert }
})
