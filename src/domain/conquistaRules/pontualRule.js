/**
 * Conquista "Pontual": todas as tarefas entregues dentro do prazo.
 *
 * Avalia apenas as datas (dataEntrega vs prazo), nunca a nota: uma nota
 * alta lançada depois do prazo não conta como pontual.
 * Sem tarefas entregues, nada está atrasado, então retorna true.
 */
export const pontualRule = {
  codigo: 'pontual',

  /**
   * @param {{tarefasEntregues: {dataEntrega: Date, prazo: Date}[]}} alunoContexto
   * @returns {boolean}
   */
  avaliar({ tarefasEntregues }) {
    return tarefasEntregues.every(({ dataEntrega, prazo }) => dataEntrega.getTime() <= prazo.getTime())
  },
}
