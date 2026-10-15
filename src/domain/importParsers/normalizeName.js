/**
 * Normaliza um nome para comparação: remove acentos (via decomposição
 * Unicode NFD + remoção dos diacríticos combinantes), remove espaços
 * extras nas bordas e no meio, e converte para minúsculas.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}
