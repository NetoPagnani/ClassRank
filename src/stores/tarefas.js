import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tarefasRepository } from '../repositories/tarefasRepository.js'

function normalizeTarefa(row) {
  return {
    ...row,
    turmaId: row.turmaId ?? row.turma_id,
    materiaId: row.materiaId ?? row.materia_id,
    cmspLink: row.cmspLink ?? row.cmsp_link ?? null,
    dataEntrega: row.dataEntrega ?? row.data_entrega,
    notaMaxima: row.notaMaxima ?? row.nota_maxima
  }
}

function normalizeNota(row) {
  return {
    alunoId: row.alunoId ?? row.aluno_id,
    tarefaId: row.tarefaId ?? row.tarefa_id,
    nota: row.nota,
    entregueEm: row.entregueEm ?? row.entregue_em ?? null
  }
}

const key = (turmaId, materiaId) => `${turmaId}:${materiaId}`

export const useTarefasStore = defineStore('tarefas', () => {
  const itemsByTurmaMateria = ref({})
  const notasByTarefa = ref({})
  const error = ref(null)

  async function fetchByTurmaMateria(turmaId, materiaId) {
    error.value = null
    try {
      const tarefas = (await tarefasRepository.listByTurmaMateria(turmaId, materiaId)).map(normalizeTarefa)
      itemsByTurmaMateria.value[key(turmaId, materiaId)] = tarefas

      const notas = await tarefasRepository.listNotasByTarefas(tarefas.map((t) => t.id))
      notas.map(normalizeNota).forEach((n) => {
        if (!notasByTarefa.value[n.tarefaId]) notasByTarefa.value[n.tarefaId] = {}
        notasByTarefa.value[n.tarefaId][n.alunoId] = n
      })
    } catch (err) {
      error.value = err.message
    }
  }

  async function add({ turmaId, materiaId, titulo, cmspLink, dataEntrega, notaMaxima }) {
    error.value = null
    try {
      const row = normalizeTarefa(
        await tarefasRepository.create({ turmaId, materiaId, titulo, cmspLink, dataEntrega, notaMaxima })
      )
      const k = key(turmaId, materiaId)
      if (!itemsByTurmaMateria.value[k]) itemsByTurmaMateria.value[k] = []
      itemsByTurmaMateria.value[k].push(row)
      return row
    } catch (err) {
      error.value = err.message
    }
  }

  async function remove(id) {
    error.value = null
    try {
      await tarefasRepository.remove(id)
      for (const k in itemsByTurmaMateria.value) {
        itemsByTurmaMateria.value[k] = itemsByTurmaMateria.value[k].filter((t) => t.id !== id)
      }
      delete notasByTarefa.value[id]
    } catch (err) {
      error.value = err.message
    }
  }

  async function saveNota(alunoId, tarefaId, nota, entregueEm = null) {
    error.value = null
    try {
      await tarefasRepository.saveNota(alunoId, tarefaId, nota, entregueEm)
      if (!notasByTarefa.value[tarefaId]) notasByTarefa.value[tarefaId] = {}
      notasByTarefa.value[tarefaId][alunoId] = { alunoId, tarefaId, nota, entregueEm }
    } catch (err) {
      error.value = err.message
    }
  }

  return { itemsByTurmaMateria, notasByTarefa, error, fetchByTurmaMateria, add, remove, saveNota }
})
