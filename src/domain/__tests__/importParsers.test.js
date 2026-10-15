import { ImportParserFactory } from '../importParsers/ImportParserFactory.js'
import { CsvParser } from '../importParsers/CsvParser.js'
import { XlsxParser } from '../importParsers/XlsxParser.js'
import { normalizeName } from '../importParsers/normalizeName.js'
import ExcelJS from 'exceljs'

test('normalizeName remove acento, espaços extras e caixa', () => {
  expect(normalizeName('  João  Pedro ')).toBe('joao pedro')
})
test('ImportParserFactory.create escolhe CsvParser para .csv', () => {
  expect(ImportParserFactory.create(new File([''], 'x.csv'))).toBeInstanceOf(CsvParser)
})
test('ImportParserFactory.create escolhe XlsxParser para .xlsx', () => {
  expect(ImportParserFactory.create(new File([''], 'x.xlsx'))).toBeInstanceOf(XlsxParser)
})
test('ImportParserFactory.create lança erro para extensão desconhecida', () => {
  expect(() => ImportParserFactory.create(new File([''], 'x.pdf'))).toThrow()
})
test('CsvParser.parse mapeia linhas "nome,nota" para objetos', async () => {
  const file = new File(['nome,nota\nAna,8.5\n'], 'x.csv', { type: 'text/csv' })
  await expect(new CsvParser().parse(file)).resolves.toEqual([{ nome: 'Ana', nota: 8.5 }])
})
test('XlsxParser.parse mapeia linhas de uma planilha gerada com exceljs', async () => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('relatorio')
  sheet.addRow(['nome', 'nota'])
  sheet.addRow(['Ana', 8.5])
  const buffer = await workbook.xlsx.writeBuffer()
  const file = new File([buffer], 'x.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  await expect(new XlsxParser().parse(file)).resolves.toEqual([{ nome: 'Ana', nota: 8.5 }])
})
