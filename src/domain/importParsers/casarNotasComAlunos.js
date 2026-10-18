import { normalizeName } from './normalizeName.js'

/**
 * Liga as linhas lidas do relatório ({nome, nota}) aos alunos da turma pelo nome
 * normalizado (sem acento, espaço extra ou diferença de maiúscula).
 * Linhas que não dá para lançar com segurança vão para `problemas`, com o motivo.
 *
 * @param {{nome: string, nota: number}[]} linhas
 * @param {{id: string, nome: string}[]} alunos
 * @param {number} notaMaxima nota máxima da tarefa
 * @returns {{ encontrados: {aluno: object, nota: number}[], problemas: {nome: string, nota: number, motivo: string}[] }}
 */
export function casarNotasComAlunos(linhas, alunos, notaMaxima) {
  const alunosPorNome = new Map()
  for (const aluno of alunos) {
    const chave = normalizeName(aluno.nome)
    alunosPorNome.set(chave, [...(alunosPorNome.get(chave) ?? []), aluno])
  }

  const encontrados = []
  const problemas = []
  const jaLancados = new Set()

  for (const { nome, nota } of linhas) {
    const candidatos = alunosPorNome.get(normalizeName(nome ?? '')) ?? []
    let motivo = null
    if (candidatos.length === 0) motivo = 'aluno não encontrado na turma'
    else if (candidatos.length > 1) motivo = 'mais de um aluno com esse nome'
    else if (!Number.isFinite(nota)) motivo = 'nota inválida'
    else if (nota < 0 || nota > notaMaxima) motivo = `nota fora de 0 a ${notaMaxima}`
    else if (jaLancados.has(candidatos[0].id)) motivo = 'aluno repetido na planilha'

    if (motivo) {
      problemas.push({ nome, nota, motivo })
    } else {
      jaLancados.add(candidatos[0].id)
      encontrados.push({ aluno: candidatos[0], nota })
    }
  }

  return { encontrados, problemas }
}

/** Converte "8,5", "8.5" ou 8.5 em número (NaN se não for nota). */
export function lerNota(valor) {
  if (typeof valor === 'number') return valor
  const texto = String(valor ?? '').trim().replace(',', '.')
  return texto === '' ? NaN : Number(texto)
}
