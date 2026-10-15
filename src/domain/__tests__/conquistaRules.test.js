import { pontualRule } from '../conquistaRules/pontualRule.js'
import { notaMaximaRule } from '../conquistaRules/notaMaximaRule.js'
import { presencaExemplarRule } from '../conquistaRules/presencaExemplarRule.js'

test('pontualRule: true quando todas as tarefas entregues até o prazo', () => {
  expect(pontualRule.avaliar({ tarefasEntregues: [{ dataEntrega: new Date('2026-10-01'), prazo: new Date('2026-10-05') }] })).toBe(true)
})
test('pontualRule: false quando alguma tarefa entregue após o prazo', () => {
  expect(pontualRule.avaliar({ tarefasEntregues: [{ dataEntrega: new Date('2026-10-06'), prazo: new Date('2026-10-05') }] })).toBe(false)
})
test('pontualRule: true quando não há tarefas entregues (nada atrasado)', () => {
  expect(pontualRule.avaliar({ tarefasEntregues: [] })).toBe(true)
})
test('notaMaximaRule: true quando notaFinal >= 9', () => {
  expect(notaMaximaRule.avaliar({ notaFinal: 9 })).toBe(true)
  expect(notaMaximaRule.avaliar({ notaFinal: 8.9 })).toBe(false)
})
test('presencaExemplarRule: true quando toda participacaoPorMateria >= 9', () => {
  expect(presencaExemplarRule.avaliar({ participacaoPorMateria: [9, 10, 9.5] })).toBe(true)
  expect(presencaExemplarRule.avaliar({ participacaoPorMateria: [9, 8, 9.5] })).toBe(false)
})
test('presencaExemplarRule: false quando não há matérias (sem dado = não exemplar)', () => {
  expect(presencaExemplarRule.avaliar({ participacaoPorMateria: [] })).toBe(false)
})
