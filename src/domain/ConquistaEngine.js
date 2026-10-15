/**
 * Engine de conquistas (Strategy): roda cada regra sobre o contexto do aluno
 * e devolve os códigos das conquistas desbloqueadas.
 */
import { pontualRule } from './conquistaRules/pontualRule.js'
import { notaMaximaRule } from './conquistaRules/notaMaximaRule.js'
import { presencaExemplarRule } from './conquistaRules/presencaExemplarRule.js'

/**
 * @param {{tarefasEntregues: object[], notaFinal: number, participacaoPorMateria: number[]}} alunoContexto
 * @param {{codigo: string, avaliar: (alunoContexto: object) => boolean}[]} [regras]
 * @returns {string[]} códigos das conquistas desbloqueadas, na ordem das regras
 */
export function avaliarConquistas(alunoContexto, regras = [pontualRule, notaMaximaRule, presencaExemplarRule]) {
  return regras.filter((regra) => regra.avaliar(alunoContexto)).map((regra) => regra.codigo)
}
