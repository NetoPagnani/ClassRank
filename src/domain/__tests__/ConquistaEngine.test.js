import { avaliarConquistas } from '../ConquistaEngine.js'

test('avaliarConquistas retorna os códigos das regras satisfeitas', () => {
  const alunoContexto = {
    tarefasEntregues: [{ nota: 10, notaMaxima: 10, dataEntrega: new Date('2026-10-01'), prazo: new Date('2026-10-05') }],
    notaFinal: 9.5,
    participacaoPorMateria: [9, 8],
  }
  expect(avaliarConquistas(alunoContexto)).toEqual(['pontual', 'nota_maxima'])
})
