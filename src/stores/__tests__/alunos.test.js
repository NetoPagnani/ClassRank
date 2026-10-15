import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const listByTurmaMock = vi.fn()
const createMock = vi.fn()
const updateMock = vi.fn()
const uploadAvatarMock = vi.fn()

vi.mock('../../repositories/alunosRepository.js', () => ({
  alunosRepository: {
    listByTurma: (...args) => listByTurmaMock(...args),
    create: (...args) => createMock(...args),
    update: (...args) => updateMock(...args)
  }
}))

vi.mock('../../repositories/storageRepository.js', () => ({
  storageRepository: {
    uploadAvatar: (...args) => uploadAvatarMock(...args)
  }
}))

const { useAlunosStore } = await import('../alunos.js')

describe('useAlunosStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listByTurmaMock.mockReset()
    createMock.mockReset()
    updateMock.mockReset()
    uploadAvatarMock.mockReset()
  })

  describe('fetchByTurma', () => {
    it('populates itemsByTurma[turmaId] on success', async () => {
      const alunos = [{ id: 'a1', turmaId: 't1', nome: 'João', fotoUrl: null }]
      listByTurmaMock.mockResolvedValue(alunos)
      const store = useAlunosStore()

      await store.fetchByTurma('t1')

      expect(listByTurmaMock).toHaveBeenCalledWith('t1')
      expect(store.itemsByTurma['t1']).toEqual(alunos)
      expect(store.error).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      listByTurmaMock.mockRejectedValue(new Error('network down'))
      const store = useAlunosStore()

      await expect(store.fetchByTurma('t1')).resolves.toBeUndefined()

      expect(store.error).toBe('network down')
    })
  })

  describe('add', () => {
    it('pushes the new row into itemsByTurma[turmaId] (initializing it) and returns it', async () => {
      const row = { id: 'a1', turmaId: 't1', nome: 'João', fotoUrl: null }
      createMock.mockResolvedValue(row)
      const store = useAlunosStore()

      const result = await store.add({ turmaId: 't1', nome: 'João' })

      expect(createMock).toHaveBeenCalledWith({ turmaId: 't1', nome: 'João', fotoUrl: null })
      expect(store.itemsByTurma['t1']).toContainEqual(row)
      expect(result).toBe(row)
    })

    it('appends to an existing itemsByTurma[turmaId] array without replacing it', async () => {
      const existing = { id: 'a0', turmaId: 't1', nome: 'Maria', fotoUrl: null }
      const row = { id: 'a1', turmaId: 't1', nome: 'João', fotoUrl: null }
      createMock.mockResolvedValue(row)
      const store = useAlunosStore()
      store.itemsByTurma['t1'] = [existing]

      await store.add({ turmaId: 't1', nome: 'João' })

      expect(store.itemsByTurma['t1']).toEqual([existing, row])
    })

    it('sets error and does not throw on failure', async () => {
      createMock.mockRejectedValue(new Error('invalid nome'))
      const store = useAlunosStore()

      await expect(store.add({ turmaId: 't1', nome: 'João' })).resolves.toBeUndefined()

      expect(store.error).toBe('invalid nome')
    })
  })

  describe('uploadFoto', () => {
    it('uploads the file, updates the repository, and updates the aluno in itemsByTurma', async () => {
      const aluno = { id: 'a1', turmaId: 't1', nome: 'João', fotoUrl: null }
      const file = { name: 'foto.png' }
      uploadAvatarMock.mockResolvedValue('https://example.com/foto.png')
      updateMock.mockResolvedValue(undefined)
      const store = useAlunosStore()
      store.itemsByTurma['t1'] = [aluno]

      await store.uploadFoto('a1', file)

      expect(uploadAvatarMock).toHaveBeenCalledWith('a1', file)
      expect(updateMock).toHaveBeenCalledWith('a1', { fotoUrl: 'https://example.com/foto.png' })
      expect(store.itemsByTurma['t1'][0].fotoUrl).toBe('https://example.com/foto.png')
      expect(store.error).toBeNull()
    })

    it('finds the aluno across all turma arrays, not just one', async () => {
      const alunoOutro = { id: 'a9', turmaId: 't2', nome: 'Outro', fotoUrl: null }
      const aluno = { id: 'a1', turmaId: 't1', nome: 'João', fotoUrl: null }
      const file = { name: 'foto.png' }
      uploadAvatarMock.mockResolvedValue('https://example.com/foto.png')
      updateMock.mockResolvedValue(undefined)
      const store = useAlunosStore()
      store.itemsByTurma['t2'] = [alunoOutro]
      store.itemsByTurma['t1'] = [aluno]

      await store.uploadFoto('a1', file)

      expect(store.itemsByTurma['t1'][0].fotoUrl).toBe('https://example.com/foto.png')
      expect(store.itemsByTurma['t2'][0].fotoUrl).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      uploadAvatarMock.mockRejectedValue(new Error('upload failed'))
      const store = useAlunosStore()

      await expect(store.uploadFoto('a1', { name: 'foto.png' })).resolves.toBeUndefined()

      expect(store.error).toBe('upload failed')
      expect(updateMock).not.toHaveBeenCalled()
    })
  })
})
