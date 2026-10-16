import { defineStore } from 'pinia'
import { ref } from 'vue'
import { turmaMateriasRepository } from '../repositories/turmaMateriasRepository.js'

export const useTurmaMateriasStore = defineStore('turmaMaterias', () => {
  const materiaIdsByTurma = ref({})
  const error = ref(null)

  async function fetchByTurma(turmaId) {
    error.value = null
    try {
      const rows = await turmaMateriasRepository.listByTurma(turmaId)
      materiaIdsByTurma.value[turmaId] = rows.map((r) => r.materiaId ?? r.materia_id)
    } catch (err) {
      error.value = err.message
    }
  }

  async function link(turmaId, materiaId) {
    error.value = null
    try {
      await turmaMateriasRepository.link(turmaId, materiaId)
      if (!materiaIdsByTurma.value[turmaId]) materiaIdsByTurma.value[turmaId] = []
      if (!materiaIdsByTurma.value[turmaId].includes(materiaId)) {
        materiaIdsByTurma.value[turmaId].push(materiaId)
      }
    } catch (err) {
      error.value = err.message
    }
  }

  async function unlink(turmaId, materiaId) {
    error.value = null
    try {
      await turmaMateriasRepository.unlink(turmaId, materiaId)
      if (materiaIdsByTurma.value[turmaId]) {
        materiaIdsByTurma.value[turmaId] = materiaIdsByTurma.value[turmaId].filter((id) => id !== materiaId)
      }
    } catch (err) {
      error.value = err.message
    }
  }

  return { materiaIdsByTurma, error, fetchByTurma, link, unlink }
})
