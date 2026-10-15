/**
 * Parser para relatórios de notas da CMSP exportados em CSV.
 * Espera um cabeçalho ("nome,nota") seguido de uma linha por aluno.
 */
export class CsvParser {
  /**
   * @param {File} file
   * @returns {Promise<{nome: string, nota: number}[]>}
   */
  async parse(file) {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
    const dataLines = lines.slice(1)

    return dataLines.map((line) => {
      const [nome, nota] = line.split(',')
      return { nome: nome.trim(), nota: Number(nota) }
    })
  }
}
