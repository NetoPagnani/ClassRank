/**
 * Strategy for computing a student's final grade.
 *
 * Nota final = média simples das 4 categorias (cada uma na escala 0-10):
 * média das tarefas, Prova 1, Prova 2 e Participação.
 */

/**
 * Média das tarefas lançadas, normalizada para a escala 0-10.
 * Cada nota é convertida por `nota / notaMaxima * 10` antes da média.
 * Sem tarefas lançadas, retorna 0.
 *
 * @param {{nota: number, notaMaxima: number}[]} tarefas
 * @returns {number}
 */
export function calcularMediaTarefas(tarefas) {
  if (tarefas.length === 0) return 0

  const soma = tarefas.reduce((total, { nota, notaMaxima }) => total + (nota / notaMaxima) * 10, 0)
  return soma / tarefas.length
}

/**
 * Nota final: média simples das 4 categorias (0-10 cada).
 *
 * @param {{mediaTarefas: number, prova1: number, prova2: number, participacao: number}} notas
 * @returns {number}
 */
export function calcularNotaFinal({ mediaTarefas, prova1, prova2, participacao }) {
  return (mediaTarefas + prova1 + prova2 + participacao) / 4
}
