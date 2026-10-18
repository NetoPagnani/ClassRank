import ExcelJS from 'exceljs'

/**
 * Monta a planilha-modelo de notas de uma tarefa no formato que o XlsxParser lê:
 * cabeçalho na 1ª linha, nome do aluno na coluna A e nota na coluna B (em branco).
 * Já vem com todos os alunos da turma, então os nomes sempre batem na importação.
 *
 * @param {{nome: string}[]} alunos
 * @param {{titulo: string, notaMaxima: number}} tarefa
 * @returns {Promise<ArrayBuffer>}
 */
export async function gerarModeloPlanilha(alunos, tarefa) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Notas')
  sheet.columns = [
    { header: 'nome', key: 'nome', width: 40 },
    { header: `nota (0 a ${tarefa.notaMaxima})`, key: 'nota', width: 16 }
  ]
  sheet.getRow(1).font = { bold: true }

  const ordenados = [...alunos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  for (const aluno of ordenados) sheet.addRow({ nome: aluno.nome, nota: null })

  // A nota aceita só número entre 0 e a nota máxima da tarefa (o Excel avisa se digitar errado)
  const ultimaLinha = ordenados.length + 1
  for (let linha = 2; linha <= ultimaLinha; linha++) {
    sheet.getCell(`B${linha}`).dataValidation = {
      type: 'decimal',
      operator: 'between',
      allowBlank: true,
      formulae: [0, tarefa.notaMaxima],
      showErrorMessage: true,
      errorTitle: 'Nota inválida',
      error: `Digite uma nota de 0 a ${tarefa.notaMaxima}.`
    }
  }

  return workbook.xlsx.writeBuffer()
}

/** Nome de arquivo seguro a partir do título da tarefa. */
export function nomeArquivoModelo(tarefa) {
  const base = tarefa.titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .slice(0, 100)
    .replace(/^-+|-+$/g, '')
  return `notas-${base || 'tarefa'}.xlsx`
}
