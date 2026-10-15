import { defineStore } from 'pinia'
import { ref } from 'vue'
import { materiasRepository } from '../repositories/materiasRepository.js'

export const useMateriasStore = defineStore('materias', () => {
  const items = ref([])
  const selectedId = ref(null)
  const error = ref(null)

  async function fetchAll() {
    error.value = null
    try {
      items.value = await materiasRepository.list()
    } catch (err) {
      error.value = err.message
    }
  }

  async function add(nome) {
    error.value = null
    try {
      const row = await materiasRepository.create(nome)
      items.value.push(row)
      return row
    } catch (err) {
      error.value = err.message
    }
  }

  return { items, selectedId, error, fetchAll, add }
})
