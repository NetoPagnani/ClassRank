// Empate = mesma nota final como aparece na tela (1 casa decimal).
// Posições "densas": 9, 9, 8 → 1º, 1º, 2º — assim o pódio sempre tem até 3 degraus.
const notaExibida = (notaFinal) => Math.round(Number(notaFinal) * 10) / 10

export function classificarRanking(linhas) {
  const ordenadas = [...linhas].sort((a, b) => notaExibida(b.notaFinal) - notaExibida(a.notaFinal))
  let posicao = 0
  let notaAnterior = null
  return ordenadas.map((linha) => {
    const nota = notaExibida(linha.notaFinal)
    if (nota !== notaAnterior) {
      posicao += 1
      notaAnterior = nota
    }
    return { ...linha, posicao }
  })
}

export function agruparPodio(linhas, degraus = 3) {
  const grupos = []
  for (const linha of classificarRanking(linhas)) {
    if (linha.posicao > degraus) break
    const grupo = grupos[linha.posicao - 1]
    if (grupo) grupo.linhas.push(linha)
    else grupos.push({ posicao: linha.posicao, notaFinal: linha.notaFinal, linhas: [linha] })
  }
  return grupos
}
