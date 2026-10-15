/**
 * Conquista "Nota máxima": nota final igual ou acima de 9.
 */
export const notaMaximaRule = {
  codigo: 'nota_maxima',

  /**
   * @param {{notaFinal: number}} alunoContexto
   * @returns {boolean}
   */
  avaliar({ notaFinal }) {
    return notaFinal >= 9
  },
}
