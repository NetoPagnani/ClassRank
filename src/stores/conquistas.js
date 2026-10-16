import { defineStore } from 'pinia'
import { ref } from 'vue'
import { conquistasRepository } from '../repositories/conquistasRepository.js'

export const useConquistasStore = defineStore('conquistas', () => {
  const catalogo = ref([])
  const byAluno = ref({})
  const error = ref(null)

  async function fetchCatalogo() {
    error.value = null
    try {
      catalogo.value = await conquistasRepository.listCatalogo()
    } catch (err) {
      error.value = err.message
    }
  }

  async function fetchByAluno(alunoId) {
    error.value = null
    try {
      byAluno.value[alunoId] = await conquistasRepository.listByAluno(alunoId)
    } catch (err) {
      error.value = err.message
    }
  }

  async function unlock(alunoId, codigo) {
    error.value = null
    try {
      await conquistasRepository.unlock(alunoId, codigo)
      await fetchByAluno(alunoId)
    } catch (err) {
      error.value = err.message
    }
  }

  return { catalogo, byAluno, error, fetchCatalogo, fetchByAluno, unlock }
})
