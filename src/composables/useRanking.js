import { computed } from 'vue'
import { calcularMediaTarefas, calcularNotaFinal } from '../domain/NotaFinalCalculator.js'

/**
 * Combina alunos, tarefas lançadas e avaliações (prova1/prova2/participação)
 * em uma lista ordenada por nota final (desc).
 *
 * @param {{alunos: import('vue').Ref<object[]>, tarefas: import('vue').Ref<object[]>, notasByTarefa: import('vue').Ref<object>, avaliacoesByAluno: import('vue').Ref<object>}} refs
 */
export function useRanking({ alunos, tarefas, notasByTarefa, avaliacoesByAluno }) {
  return computed(() => {
    const linhas = alunos.value.map((aluno) => {
      const notasTarefas = tarefas.value
        .map((tarefa) => {
          const nota = notasByTarefa.value[tarefa.id]?.[aluno.id]
          return nota ? { nota: nota.nota, notaMaxima: tarefa.notaMaxima } : null
        })
        .filter((n) => n && n.notaMaxima > 0)

      const mediaTarefas = calcularMediaTarefas(notasTarefas)
      const avaliacao = avaliacoesByAluno.value[aluno.id] ?? {}
      const notaFinal = calcularNotaFinal({
        mediaTarefas,
        prova1: avaliacao.prova1 ?? 0,
        prova2: avaliacao.prova2 ?? 0,
        participacao: avaliacao.participacao ?? 0
      })

      return { aluno, mediaTarefas, notaFinal }
    })

    return linhas.sort((a, b) => b.notaFinal - a.notaFinal)
  })
}
