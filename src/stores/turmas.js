import { defineStore } from 'pinia'
import { ref } from 'vue'
import { turmasRepository } from '../repositories/turmasRepository.js'

export const useTurmasStore = defineStore('turmas', () => {
  const items = ref([])
  const selectedId = ref(null)
  const error = ref(null)

  async function fetchAll() {
    error.value = null
    try {
      items.value = await turmasRepository.list()
    } catch (err) {
      error.value = err.message
    }
  }

  async function add(nome) {
    error.value = null
    try {
      const row = await turmasRepository.create(nome)
      items.value.push(row)
      return row
    } catch (err) {
      error.value = err.message
    }
  }

  async function remove(id) {
    error.value = null
    try {
      await turmasRepository.remove(id)
      items.value = items.value.filter((turma) => turma.id !== id)
      if (selectedId.value === id) selectedId.value = null
    } catch (err) {
      error.value = err.message
    }
  }

  return { items, selectedId, error, fetchAll, add, remove }
})
