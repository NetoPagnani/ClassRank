import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getByTurmaMock = vi.fn()
const upsertMock = vi.fn()

vi.mock('../../repositories/missoesRepository.js', () => ({
  missoesRepository: {
    getByTurma: (...args) => getByTurmaMock(...args),
    upsert: (...args) => upsertMock(...args)
  }
}))

const { useMissoesStore } = await import('../missoes.js')

describe('useMissoesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getByTurmaMock.mockReset()
    upsertMock.mockReset()
  })

  describe('fetchByTurma', () => {
    it('populates itemsByTurma[turmaId] on success', async () => {
      const missoes = [{ id: '1', turmaId: 't1', titulo: 'Semana 1', meta: 5, progressoAtual: 2 }]
      getByTurmaMock.mockResolvedValue(missoes)
      const store = useMissoesStore()

      await store.fetchByTurma('t1')

      expect(getByTurmaMock).toHaveBeenCalledWith('t1')
      expect(store.itemsByTurma['t1']).toEqual(missoes)
      expect(store.error).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      getByTurmaMock.mockRejectedValue(new Error('network down'))
      const store = useMissoesStore()

      await expect(store.fetchByTurma('t1')).resolves.toBeUndefined()

      expect(store.error).toBe('network down')
    })
  })

  describe('upsert', () => {
    it('upserts and refreshes itemsByTurma[turmaId]', async () => {
      upsertMock.mockResolvedValue(undefined)
      getByTurmaMock.mockResolvedValue([
        { id: '1', turmaId: 't1', titulo: 'Entregar tudo', meta: 5, progressoAtual: 3 }
      ])
      const store = useMissoesStore()

      await store.upsert({
        turmaId: 't1',
        titulo: 'Entregar tudo',
        descricao: 'Entregar todas as tarefas da semana',
        meta: 5,
        progressoAtual: 3,
        semanaReferencia: '2026-10-19'
      })

      expect(upsertMock).toHaveBeenCalledWith({
        turmaId: 't1',
        titulo: 'Entregar tudo',
        descricao: 'Entregar todas as tarefas da semana',
        meta: 5,
        progressoAtual: 3,
        semanaReferencia: '2026-10-19'
      })
      expect(store.itemsByTurma['t1']).toHaveLength(1)
    })

    it('sets error and does not throw on failure', async () => {
      upsertMock.mockRejectedValue(new Error('upsert failed'))
      const store = useMissoesStore()

      await expect(
        store.upsert({
          turmaId: 't1',
          titulo: 'Entregar tudo',
          descricao: null,
          meta: 5,
          progressoAtual: 0,
          semanaReferencia: '2026-10-19'
        })
      ).resolves.toBeUndefined()

      expect(store.error).toBe('upsert failed')
    })
  })
})
