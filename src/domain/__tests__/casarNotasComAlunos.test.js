import { casarNotasComAlunos, lerNota } from '../importParsers/casarNotasComAlunos.js'

const alunos = [
  { id: 'a1', nome: 'João Pedro' },
  { id: 'a2', nome: 'Ana Clara' },
  { id: 'a3', nome: 'Lucas Lima' },
  { id: 'a4', nome: 'Lucas  lima' }
]

test('casa o nome da planilha com o aluno ignorando acento, espaço e maiúscula', () => {
  const { encontrados, problemas } = casarNotasComAlunos([{ nome: ' joao  PEDRO', nota: 8 }], alunos, 10)
  expect(encontrados).toEqual([{ aluno: alunos[0], nota: 8 }])
  expect(problemas).toEqual([])
})

test('separa os problemas com o motivo, sem lançar nada errado', () => {
  const { encontrados, problemas } = casarNotasComAlunos(
    [
      { nome: 'Fulano', nota: 5 },
      { nome: 'Lucas Lima', nota: 5 },
      { nome: 'Ana Clara', nota: NaN },
      { nome: 'João Pedro', nota: 12 },
      { nome: 'Ana Clara', nota: 9 },
      { nome: 'ana clara', nota: 7 }
    ],
    alunos,
    10
  )
  expect(encontrados).toEqual([{ aluno: alunos[1], nota: 9 }])
  expect(problemas.map((p) => p.motivo)).toEqual([
    'aluno não encontrado na turma',
    'mais de um aluno com esse nome',
    'nota inválida',
    'nota fora de 0 a 10',
    'aluno repetido na planilha'
  ])
})

test('lerNota entende vírgula decimal e recusa texto vazio', () => {
  expect(lerNota('8,5')).toBe(8.5)
  expect(lerNota(7)).toBe(7)
  expect(lerNota('')).toBeNaN()
  expect(lerNota('faltou')).toBeNaN()
})
