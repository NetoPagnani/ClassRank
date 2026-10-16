import avatarFeminino from '../assets/avatar-padrao-1.png'
import avatarMasculino from '../assets/avatar-padrao-2.png'

export const AVATARES_PADRAO = [
  { id: 'feminino', url: avatarFeminino },
  { id: 'masculino', url: avatarMasculino }
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
