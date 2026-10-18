import avatarFeminino from '../assets/avatar-padrao-1.png'
import avatarMasculino from '../assets/avatar-padrao-2.png'

// No banco o avatar padrão fica guardado como "padrao:<id>", nunca como o link do
// arquivo: o link muda a cada build (o nome leva um hash) e a foto quebraria.
const PREFIXO = 'padrao:'

export const AVATARES_PADRAO = [
  { id: 'feminino', url: avatarFeminino, valor: `${PREFIXO}feminino` },
  { id: 'masculino', url: avatarMasculino, valor: `${PREFIXO}masculino` }
]

/**
 * Escolhe um avatar padrão pelo nome do aluno (heurística simples: nomes
 * terminados em "a" tendem a ser femininos em português). Não é perfeito,
 * mas acerta a maioria dos casos — bem melhor que sortear ao acaso.
 */
export function avatarPadrao(nome) {
  if (!nome) return avatarMasculino
  const primeiroNome = nome.trim().split(/\s+/)[0].toLowerCase()
  return primeiroNome.endsWith('a') ? avatarFeminino : avatarMasculino
}

/**
 * Diz qual avatar padrão está gravado em foto_url, ou null se for foto real/vazio.
 * Também reconhece os links antigos gravados antes ("/assets/avatar-padrao-1-<hash>.png").
 */
export function idAvatarPadrao(fotoUrl) {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith(PREFIXO)) return fotoUrl.slice(PREFIXO.length)
  if (/avatar-padrao-1[-.]/.test(fotoUrl)) return 'feminino'
  if (/avatar-padrao-2[-.]/.test(fotoUrl)) return 'masculino'
  return null
}

/** Endereço da imagem a exibir para o aluno: foto real, avatar padrão escolhido ou o padrão pelo nome. */
export function fotoDoAluno(fotoUrl, nome) {
  const id = idAvatarPadrao(fotoUrl)
  if (id) return AVATARES_PADRAO.find((a) => a.id === id)?.url ?? avatarPadrao(nome)
  return fotoUrl || avatarPadrao(nome)
}

/** Se a foto salva não carregar (ex.: link antigo), troca uma única vez pelo avatar padrão. */
export function usarAvatarPadraoNoErro(evento, nome) {
  const img = evento.target
  if (img.dataset.avatarPadrao) return
  img.dataset.avatarPadrao = '1'
  img.src = avatarPadrao(nome)
}
