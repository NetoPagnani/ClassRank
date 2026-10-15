import { CsvParser } from './CsvParser.js'
import { XlsxParser } from './XlsxParser.js'

/**
 * Factory que escolhe o parser correto para um relatório de notas da
 * CMSP de acordo com a extensão do arquivo enviado pelo professor.
 */
export class ImportParserFactory {
  /**
   * @param {File} file
   * @returns {CsvParser|XlsxParser}
   */
  static create(file) {
    const extensao = file.name.toLowerCase().split('.').pop()

    if (extensao === 'csv') return new CsvParser()
    if (extensao === 'xlsx' || extensao === 'xls') return new XlsxParser()

    throw new Error(`Extensão de arquivo não suportada: .${extensao}`)
  }
}
