import { calcularMediaTarefas, calcularNotaFinal } from '../NotaFinalCalculator.js'

test('normaliza nota de tarefa para escala 0-10', () => {
  expect(calcularMediaTarefas([{ nota: 4, notaMaxima: 5 }])).toBe(8)
})
test('retorna 0 quando não há tarefas lançadas', () => {
  expect(calcularMediaTarefas([])).toBe(0)
})
test('nota final é a média simples das 4 categorias', () => {
  expect(calcularNotaFinal({ mediaTarefas: 8, prova1: 6, prova2: 10, participacao: 8 })).toBe(8)
})
