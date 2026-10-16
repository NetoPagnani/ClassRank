import { classificarRanking, agruparPodio } from '../RankingPosicoes.js'

const linha = (nome, notaFinal) => ({ aluno: { id: nome, nome }, notaFinal })

test('classificarRanking dá a mesma posição a quem empata na nota exibida', () => {
  const resultado = classificarRanking([linha('Ana', 9), linha('Bia', 9), linha('Caio', 8.5), linha('Duda', 7)])
  expect(resultado.map((l) => [l.aluno.nome, l.posicao])).toEqual([
    ['Ana', 1],
    ['Bia', 1],
    ['Caio', 2],
    ['Duda', 3]
  ])
})

test('classificarRanking compara pela nota arredondada em 1 casa, como aparece na tela', () => {
  const resultado = classificarRanking([linha('Ana', 8.04), linha('Bia', 7.96)])
  expect(resultado.map((l) => l.posicao)).toEqual([1, 1])
})

test('classificarRanking ordena por nota desc mesmo se a entrada vier fora de ordem', () => {
  const resultado = classificarRanking([linha('Duda', 7), linha('Ana', 9)])
  expect(resultado.map((l) => l.aluno.nome)).toEqual(['Ana', 'Duda'])
})

test('agruparPodio junta empatados no mesmo degrau e limita a 3 degraus', () => {
  const grupos = agruparPodio([linha('Ana', 9), linha('Bia', 9), linha('Caio', 8), linha('Duda', 7), linha('Edu', 6)])
  expect(grupos.map((g) => [g.posicao, g.linhas.map((l) => l.aluno.nome)])).toEqual([
    [1, ['Ana', 'Bia']],
    [2, ['Caio']],
    [3, ['Duda']]
  ])
})

test('agruparPodio com menos de 3 notas distintas devolve menos degraus', () => {
  expect(agruparPodio([linha('Ana', 5), linha('Bia', 5)])).toHaveLength(1)
  expect(agruparPodio([])).toEqual([])
})
