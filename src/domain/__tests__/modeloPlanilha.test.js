import { gerarModeloPlanilha, nomeArquivoModelo } from '../importParsers/modeloPlanilha.js'
import { XlsxParser } from '../importParsers/XlsxParser.js'
import ExcelJS from 'exceljs'

const alunos = [{ id: 'a2', nome: 'Bia' }, { id: 'a1', nome: 'Ana' }]
const tarefa = { titulo: 'Semana 21 - Tarefa 1', notaMaxima: 10 }

test('o modelo vem com cabeçalho e todos os alunos em ordem alfabética, nota em branco', async () => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await gerarModeloPlanilha(alunos, tarefa))
  const sheet = workbook.worksheets[0]
  expect(sheet.getRow(1).values.slice(1)).toEqual(['nome', 'nota (0 a 10)'])
  expect([sheet.getCell('A2').value, sheet.getCell('A3').value]).toEqual(['Ana', 'Bia'])
  expect(sheet.getCell('B2').value).toBeNull()
})

test('o modelo preenchido é lido de volta pelo XlsxParser, pulando quem ficou sem nota', async () => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await gerarModeloPlanilha(alunos, tarefa))
  workbook.worksheets[0].getCell('B2').value = 9.5
  const file = new File([await workbook.xlsx.writeBuffer()], 'notas.xlsx')
  await expect(new XlsxParser().parse(file)).resolves.toEqual([{ nome: 'Ana', nota: 9.5 }])
})

test('nomeArquivoModelo tira acento e símbolo do título', () => {
  expect(nomeArquivoModelo({ titulo: 'Redes: Segurança - Tarefa 1' })).toBe('notas-redes-seguranca-tarefa-1.xlsx')
})
