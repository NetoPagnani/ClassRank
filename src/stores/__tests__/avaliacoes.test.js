import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getByAlunoMateriaMock = vi.fn()
const upsertMock = vi.fn()
const listByAlunoMock = vi.fn()

vi.mock('../../repositories/avaliacoesRepository.js', () => ({
  avaliacoesRepository: {
    getByAlunoMateria: (...args) => getByAlunoMateriaMock(...args),
    upsert: (...args) => upsertMock(...args),
    listByAluno: (...args) => listByAlunoMock(...args)
  }
}))

const { useAvaliacoesStore } = await import('../avaliacoes.js')

describe('useAvaliacoesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getByAlunoMateriaMock.mockReset()
    upsertMock.mockReset()
    listByAlunoMock.mockReset()
  })

  describe('fetchByAlunoMateria', () => {
    it('populates itemsByAlunoMateria with the normalized row on success', async () => {
      getByAlunoMateriaMock.mockResolvedValue({ aluno_id: 'a1', materia_id: 'm1', prova1: 7, prova2: 8, participacao: 9 })
      const store = useAvaliacoesStore()

      await store.fetchByAlunoMateria('a1', 'm1')

      expect(getByAlunoMateriaMock).toHaveBeenCalledWith('a1', 'm1')
      expect(store.itemsByAlunoMateria['a1:m1']).toEqual({
        alunoId: 'a1',
        materiaId: 'm1',
        prova1: 7,
        prova2: 8,
        participacao: 9
      })
      expect(store.error).toBeNull()
    })

    it('stores a default empty record when no avaliacao exists yet', async () => {
      getByAlunoMateriaMock.mockResolvedValue(null)
      const store = useAvaliacoesStore()

      await store.fetchByAlunoMateria('a1', 'm1')

      expect(store.itemsByAlunoMateria['a1:m1']).toEqual({
        alunoId: 'a1',
        materiaId: 'm1',
        prova1: null,
        prova2: null,
        participacao: null
      })
    })

    it('sets error and does not throw on failure', async () => {
      getByAlunoMateriaMock.mockRejectedValue(new Error('network down'))
      const store = useAvaliacoesStore()

      await expect(store.fetchByAlunoMateria('a1', 'm1')).resolves.toBeUndefined()

      expect(store.error).toBe('network down')
    })
  })

  describe('upsert', () => {
    it('writes the avaliacao into itemsByAlunoMateria on success', async () => {
      upsertMock.mockResolvedValue(undefined)
      const store = useAvaliacoesStore()

      await store.upsert({ alunoId: 'a1', materiaId: 'm1', prova1: 7, prova2: 8, participacao: 9 })

      expect(upsertMock).toHaveBeenCalledWith({ alunoId: 'a1', materiaId: 'm1', prova1: 7, prova2: 8, participacao: 9 })
      expect(store.itemsByAlunoMateria['a1:m1']).toEqual({
        alunoId: 'a1',
        materiaId: 'm1',
        prova1: 7,
        prova2: 8,
        participacao: 9
      })
    })

    it('sets error and does not throw on failure', async () => {
      upsertMock.mockRejectedValue(new Error('upsert failed'))
      const store = useAvaliacoesStore()

      await expect(
        store.upsert({ alunoId: 'a1', materiaId: 'm1', prova1: 7, prova2: null, participacao: null })
      ).resolves.toBeUndefined()

      expect(store.error).toBe('upsert failed')
    })
  })

  describe('listByAluno', () => {
    it('resolves every avaliacao for the aluno across materias', async () => {
      const rows = [{ materia_id: 'm1', prova1: 7, prova2: 8, participacao: 9 }]
      listByAlunoMock.mockResolvedValue(rows)
      const store = useAvaliacoesStore()

      await expect(store.listByAluno('a1')).resolves.toEqual(rows)

      expect(listByAlunoMock).toHaveBeenCalledWith('a1')
      expect(store.error).toBeNull()
    })

    it('sets error, resolves an empty array, and does not throw on failure', async () => {
      listByAlunoMock.mockRejectedValue(new Error('list failed'))
      const store = useAvaliacoesStore()

      await expect(store.listByAluno('a1')).resolves.toEqual([])

      expect(store.error).toBe('list failed')
    })
  })
})
