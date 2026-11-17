import { computed } from 'vue'
import { calcularMediaTarefas } from '../domain/NotaFinalCalculator.js'

/**
 * Combina alunos e tarefas lançadas em uma lista ordenada por nota final (desc).
 * A nota final é a média das tarefas.
 *
 * @param {{alunos: import('vue').Ref<object[]>, tarefas: import('vue').Ref<object[]>, notasByTarefa: import('vue').Ref<object>}} refs
 */
export function useRanking({ alunos, tarefas, notasByTarefa }) {
  return computed(() => {
    const linhas = alunos.value.map((aluno) => {
      const notasTarefas = tarefas.value
        .map((tarefa) => {
          const nota = notasByTarefa.value[tarefa.id]?.[aluno.id]
          return nota ? { nota: nota.nota, notaMaxima: tarefa.notaMaxima } : null
        })
        .filter((n) => n && n.notaMaxima > 0)

      const mediaTarefas = calcularMediaTarefas(notasTarefas)

      return { aluno, mediaTarefas, notaFinal: mediaTarefas }
    })

    return linhas.sort((a, b) => b.notaFinal - a.notaFinal)
  })
}
