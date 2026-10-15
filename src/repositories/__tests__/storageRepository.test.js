import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUserMock = vi.fn()
const storageFromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: {
    auth: { getUser: (...args) => getUserMock(...args) },
    storage: { from: (...args) => storageFromMock(...args) }
  }
}))

const { storageRepository } = await import('../storageRepository.js')

describe('storageRepository', () => {
  beforeEach(() => {
    getUserMock.mockReset()
    storageFromMock.mockReset()
  })

  it('uploadAvatar uploads under the uploader uid path and resolves the public URL', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'uid-1' } } })
    const upload = vi.fn().mockResolvedValue({ data: { path: 'uid-1/aluno-1-foto.png' }, error: null })
    const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://.../uid-1/aluno-1-foto.png' } }))
    storageFromMock.mockReturnValue({ upload, getPublicUrl })

    const file = { name: 'foto.png' }
    await expect(storageRepository.uploadAvatar('aluno-1', file)).resolves.toBe(
      'https://.../uid-1/aluno-1-foto.png'
    )

    expect(storageFromMock).toHaveBeenCalledWith('avatars')
    // This is the assertion that actually enforces the path convention: the real
    // argument passed to `upload` must be `${userId}/${alunoId}-${file.name}`,
    // not just whatever the mock happens to resolve with.
    expect(upload).toHaveBeenCalledWith('uid-1/aluno-1-foto.png', file)
    expect(getPublicUrl).toHaveBeenCalledWith('uid-1/aluno-1-foto.png')
  })

  it('uploadAvatar throws the Supabase error when the upload fails', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'uid-1' } } })
    const upload = vi.fn().mockResolvedValue({ data: null, error: { message: 'upload failed' } })
    const getPublicUrl = vi.fn()
    storageFromMock.mockReturnValue({ upload, getPublicUrl })

    const file = { name: 'foto.png' }
    await expect(storageRepository.uploadAvatar('aluno-1', file)).rejects.toThrow('upload failed')
  })
})
