/**
 * Strategy for computing a student's final grade.
 *
 * Nota final = média das tarefas lançadas, na escala 0-10.
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
