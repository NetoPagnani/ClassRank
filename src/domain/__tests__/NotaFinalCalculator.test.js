import { calcularMediaTarefas } from '../NotaFinalCalculator.js'

test('normaliza nota de tarefa para escala 0-10', () => {
  expect(calcularMediaTarefas([{ nota: 4, notaMaxima: 5 }])).toBe(8)
})
test('retorna 0 quando não há tarefas lançadas', () => {
  expect(calcularMediaTarefas([])).toBe(0)
})
test('faz a média simples das tarefas já normalizadas', () => {
  expect(calcularMediaTarefas([{ nota: 4, notaMaxima: 5 }, { nota: 6, notaMaxima: 10 }])).toBe(7)
})
