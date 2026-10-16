import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alunosRepository } from '../repositories/alunosRepository.js'
import { storageRepository } from '../repositories/storageRepository.js'

// Mutates in place (keeps reference equality for callers like `add`'s
// return value) to fill in camelCase keys the real Supabase response
// only has as snake_case (turma_id, foto_url).
function normalizeAluno(row) {
  if (row.turmaId === undefined) row.turmaId = row.turma_id
  if (row.fotoUrl === undefined) row.fotoUrl = row.foto_url ?? null
  return row
}

export const useAlunosStore = defineStore('alunos', () => {
  const itemsByTurma = ref({})
  const error = ref(null)

  async function fetchByTurma(turmaId) {
    error.value = null
    try {
      itemsByTurma.value[turmaId] = (await alunosRepository.listByTurma(turmaId)).map(normalizeAluno)
    } catch (err) {
      error.value = err.message
    }
  }

  async function add({ turmaId, nome }) {
    error.value = null
    try {
      const row = normalizeAluno(await alunosRepository.create({ turmaId, nome, fotoUrl: null }))
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

  async function definirFoto(alunoId, fotoUrl) {
    error.value = null
    try {
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

  async function renomear(alunoId, nome) {
    error.value = null
    try {
      await alunosRepository.update(alunoId, { nome })
      const aluno = Object.values(itemsByTurma.value)
        .flat()
        .find((a) => a.id === alunoId)
      if (aluno) {
        aluno.nome = nome
      }
    } catch (err) {
      error.value = err.message
    }
  }

  async function remove(alunoId, turmaId) {
    error.value = null
    try {
      await alunosRepository.remove(alunoId)
      if (itemsByTurma.value[turmaId]) {
        itemsByTurma.value[turmaId] = itemsByTurma.value[turmaId].filter((a) => a.id !== alunoId)
      }
    } catch (err) {
      error.value = err.message
    }
  }

  return { itemsByTurma, error, fetchByTurma, add, uploadFoto, definirFoto, renomear, remove }
})
