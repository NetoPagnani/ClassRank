import { AVATARES_PADRAO, idAvatarPadrao, fotoDoAluno } from '../avatarPadrao.js'

const feminino = AVATARES_PADRAO.find((a) => a.id === 'feminino')
const masculino = AVATARES_PADRAO.find((a) => a.id === 'masculino')

test('idAvatarPadrao lê a referência fixa "padrao:<id>"', () => {
  expect(idAvatarPadrao('padrao:masculino')).toBe('masculino')
})

test('idAvatarPadrao reconhece os links antigos de build com hash', () => {
  expect(idAvatarPadrao('/assets/avatar-padrao-1-BDxCxSBc.png')).toBe('feminino')
  expect(idAvatarPadrao('/assets/avatar-padrao-2-DvL_WQDN.png')).toBe('masculino')
})

test('idAvatarPadrao devolve null para foto real ou vazio', () => {
  expect(idAvatarPadrao('https://x.supabase.co/storage/v1/object/public/avatars/a1.png')).toBeNull()
  expect(idAvatarPadrao(null)).toBeNull()
})

test('fotoDoAluno troca a referência do avatar padrão pela imagem do build atual', () => {
  expect(fotoDoAluno('padrao:feminino', 'Carlos')).toBe(feminino.url)
  expect(fotoDoAluno('/assets/avatar-padrao-2-OLDHASH.png', 'Ana')).toBe(masculino.url)
})

test('fotoDoAluno mantém foto real e usa o padrão pelo nome quando não há foto', () => {
  expect(fotoDoAluno('https://foto/real.png', 'Ana')).toBe('https://foto/real.png')
  expect(fotoDoAluno(null, 'Ana')).toBe(feminino.url)
  expect(fotoDoAluno('', 'Carlos')).toBe(masculino.url)
})
