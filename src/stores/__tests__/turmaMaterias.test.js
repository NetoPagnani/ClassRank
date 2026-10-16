import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const listByTurmaMock = vi.fn()
const linkMock = vi.fn()
const unlinkMock = vi.fn()

vi.mock('../../repositories/turmaMateriasRepository.js', () => ({
  turmaMateriasRepository: {
    listByTurma: (...args) => listByTurmaMock(...args),
    link: (...args) => linkMock(...args),
    unlink: (...args) => unlinkMock(...args)
  }
}))

const { useTurmaMateriasStore } = await import('../turmaMaterias.js')

describe('useTurmaMateriasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listByTurmaMock.mockReset()
    linkMock.mockReset()
    unlinkMock.mockReset()
  })

  describe('fetchByTurma', () => {
    it('populates materiaIdsByTurma[turmaId] with the materia ids on success', async () => {
      listByTurmaMock.mockResolvedValue([{ materia_id: 'm1' }, { materia_id: 'm2' }])
      const store = useTurmaMateriasStore()

      await store.fetchByTurma('t1')

      expect(listByTurmaMock).toHaveBeenCalledWith('t1')
      expect(store.materiaIdsByTurma['t1']).toEqual(['m1', 'm2'])
      expect(store.error).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      listByTurmaMock.mockRejectedValue(new Error('network down'))
      const store = useTurmaMateriasStore()

      await expect(store.fetchByTurma('t1')).resolves.toBeUndefined()

      expect(store.error).toBe('network down')
    })
  })

  describe('link', () => {
    it('adds the materiaId to materiaIdsByTurma[turmaId] (initializing it)', async () => {
      linkMock.mockResolvedValue(undefined)
      const store = useTurmaMateriasStore()

      await store.link('t1', 'm1')

      expect(linkMock).toHaveBeenCalledWith('t1', 'm1')
      expect(store.materiaIdsByTurma['t1']).toEqual(['m1'])
    })

    it('does not duplicate an already-linked materiaId', async () => {
      linkMock.mockResolvedValue(undefined)
      const store = useTurmaMateriasStore()
      store.materiaIdsByTurma['t1'] = ['m1']

      await store.link('t1', 'm1')

      expect(store.materiaIdsByTurma['t1']).toEqual(['m1'])
    })

    it('sets error and does not throw on failure', async () => {
      linkMock.mockRejectedValue(new Error('link failed'))
      const store = useTurmaMateriasStore()

      await expect(store.link('t1', 'm1')).resolves.toBeUndefined()

      expect(store.error).toBe('link failed')
    })
  })

  describe('unlink', () => {
    it('removes the materiaId from materiaIdsByTurma[turmaId]', async () => {
      unlinkMock.mockResolvedValue(undefined)
      const store = useTurmaMateriasStore()
      store.materiaIdsByTurma['t1'] = ['m1', 'm2']

      await store.unlink('t1', 'm1')

      expect(unlinkMock).toHaveBeenCalledWith('t1', 'm1')
      expect(store.materiaIdsByTurma['t1']).toEqual(['m2'])
    })

    it('sets error and does not throw on failure', async () => {
      unlinkMock.mockRejectedValue(new Error('unlink failed'))
      const store = useTurmaMateriasStore()
      store.materiaIdsByTurma['t1'] = ['m1']

      await expect(store.unlink('t1', 'm1')).resolves.toBeUndefined()

      expect(store.error).toBe('unlink failed')
    })
  })
})
