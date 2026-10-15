/**
 * Conquista "Presença exemplar": participação igual ou acima de 9 em todas
 * as matérias. Sem nenhuma matéria com dado, não é exemplar.
 */
export const presencaExemplarRule = {
  codigo: 'presenca_exemplar',

  /**
   * @param {{participacaoPorMateria: number[]}} alunoContexto
   * @returns {boolean}
   */
  avaliar({ participacaoPorMateria }) {
    return participacaoPorMateria.length > 0 && participacaoPorMateria.every((p) => p >= 9)
  },
}
