import avatar1 from '../assets/avatar-padrao-1.png'
import avatar2 from '../assets/avatar-padrao-2.png'

const avatares = [avatar1, avatar2]

/** Escolhe um avatar padrão de forma estável por aluno (mesmo id, mesmo avatar). */
export function avatarPadrao(id) {
  if (!id) return avatar1
  const soma = [...id].reduce((total, char) => total + char.charCodeAt(0), 0)
  return avatares[soma % avatares.length]
}
