import ExcelJS from 'exceljs'

/**
 * Parser para relatórios de notas da CMSP exportados em XLSX.
 * Lê a primeira planilha do workbook e mapeia as linhas após o
 * cabeçalho para `{nome, nota}` pela posição das colunas (1ª = nome,
 * 2ª = nota).
 */
export class XlsxParser {
  /**
   * @param {File} file
   * @returns {Promise<{nome: string, nota: number}[]>}
   */
  async parse(file) {
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const sheet = workbook.worksheets[0]
    const rows = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const nome = String(row.getCell(1).value)
      const nota = Number(row.getCell(2).value)
      rows.push({ nome, nota })
    })

    return rows
  }
}
