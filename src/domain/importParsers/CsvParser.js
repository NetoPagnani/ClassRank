import { lerNota } from './casarNotasComAlunos.js'

const tirarAspas = (texto) => texto.trim().replace(/^"(.*)"$/, '$1').trim()

/**
 * Parser para relatórios de notas da CMSP exportados em CSV.
 * Espera um cabeçalho ("nome,nota") seguido de uma linha por aluno.
 * Aceita também o formato do Excel em português: separador ";" e nota com vírgula ("8,5").
 */
export class CsvParser {
  /**
   * @param {File} file
   * @returns {Promise<{nome: string, nota: number}[]>}
   */
  async parse(file) {
    const text = (await file.text()).replace(/^﻿/, '')
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
    const separador = lines[0]?.includes(';') ? ';' : ','
    const dataLines = lines.slice(1)

    return dataLines.map((line) => {
      const [nome = '', nota = ''] = line.split(separador)
      return { nome: tirarAspas(nome), nota: lerNota(tirarAspas(nota)) }
    })
  }
}
