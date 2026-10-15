import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alunosRepository } from '../repositories/alunosRepository.js'
import { storageRepository } from '../repositories/storageRepository.js'

export const useAlunosStore = defineStore('alunos', () => {
  const itemsByTurma = ref({})
  const error = ref(null)

  async function fetchByTurma(turmaId) {
    error.value = null
    try {
      itemsByTurma.value[turmaId] = await alunosRepository.listByTurma(turmaId)
    } catch (err) {
      error.value = err.message
    }
  }

  async function add({ turmaId, nome }) {
    error.value = null
    try {
      const row = await alunosRepository.create({ turmaId, nome, fotoUrl: null })
      if (!itemsByTurma.value[turmaId]) {
        itemsByTurma.value[turmaId] = []
      }
      itemsByTurma.value[turmaId].push(row)
      return row
    } catch (err) {
      error.value = err.message
    }
  }

  async function uploadFoto(alunoId, file) {
    error.value = null
    try {
      const fotoUrl = await storageRepository.uploadAvatar(alunoId, file)
      await alunosRepository.update(alunoId, { fotoUrl })
      const aluno = Object.values(itemsByTurma.value)
        .flat()
        .find((a) => a.id === alunoId)
      if (aluno) {
        aluno.fotoUrl = fotoUrl
      }
    } catch (err) {
      error.value = err.message
    }
  }

  return { itemsByTurma, error, fetchByTurma, add, uploadFoto }
})
