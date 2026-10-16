import { defineStore } from 'pinia'
import { ref } from 'vue'
import { avaliacoesRepository } from '../repositories/avaliacoesRepository.js'

function normalizeAvaliacao(row, alunoId, materiaId) {
  if (!row) return { alunoId, materiaId, prova1: null, prova2: null, participacao: null }
  return {
    alunoId: row.alunoId ?? row.aluno_id ?? alunoId,
    materiaId: row.materiaId ?? row.materia_id ?? materiaId,
    prova1: row.prova1 ?? null,
    prova2: row.prova2 ?? null,
    participacao: row.participacao ?? null
  }
}

const key = (alunoId, materiaId) => `${alunoId}:${materiaId}`

export const useAvaliacoesStore = defineStore('avaliacoes', () => {
  const itemsByAlunoMateria = ref({})
  const error = ref(null)

  async function fetchByAlunoMateria(alunoId, materiaId) {
    error.value = null
    try {
      const row = await avaliacoesRepository.getByAlunoMateria(alunoId, materiaId)
      itemsByAlunoMateria.value[key(alunoId, materiaId)] = normalizeAvaliacao(row, alunoId, materiaId)
    } catch (err) {
      error.value = err.message
    }
  }

  async function upsert({ alunoId, materiaId, prova1, prova2, participacao }) {
    error.value = null
    try {
      await avaliacoesRepository.upsert({ alunoId, materiaId, prova1, prova2, participacao })
      itemsByAlunoMateria.value[key(alunoId, materiaId)] = { alunoId, materiaId, prova1, prova2, participacao }
    } catch (err) {
      error.value = err.message
    }
  }

  return { itemsByAlunoMateria, error, fetchByAlunoMateria, upsert }
})
