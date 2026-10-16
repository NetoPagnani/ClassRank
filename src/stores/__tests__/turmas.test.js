import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const listMock = vi.fn()
const createMock = vi.fn()
const removeMock = vi.fn()

vi.mock('../../repositories/turmasRepository.js', () => ({
  turmasRepository: {
    list: (...args) => listMock(...args),
    create: (...args) => createMock(...args),
    remove: (...args) => removeMock(...args)
  }
}))

const { useTurmasStore } = await import('../turmas.js')

describe('useTurmasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listMock.mockReset()
    createMock.mockReset()
    removeMock.mockReset()
  })

  describe('fetchAll', () => {
    it('populates items on success', async () => {
      const turmas = [{ id: '1', nome: '3º Ano TI', slug: 'abc' }]
      listMock.mockResolvedValue(turmas)
      const store = useTurmasStore()

      await store.fetchAll()

      expect(listMock).toHaveBeenCalled()
      expect(store.items).toEqual(turmas)
      expect(store.error).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      listMock.mockRejectedValue(new Error('network down'))
      const store = useTurmasStore()

      await expect(store.fetchAll()).resolves.toBeUndefined()

      expect(store.error).toBe('network down')
    })
  })

  describe('add', () => {
    it('pushes the new row into items and returns it', async () => {
      const row = { id: '1', nome: '3º Ano TI', slug: 'abc' }
      createMock.mockResolvedValue(row)
      const store = useTurmasStore()

      const result = await store.add('3º Ano TI')

      expect(createMock).toHaveBeenCalledWith('3º Ano TI')
      expect(store.items).toContainEqual(row)
      expect(result).toBe(row)
    })

    it('sets error and does not throw on failure', async () => {
      createMock.mockRejectedValue(new Error('duplicate nome'))
      const store = useTurmasStore()

      await expect(store.add('3º Ano TI')).resolves.toBeUndefined()

      expect(store.error).toBe('duplicate nome')
      expect(store.items).toEqual([])
    })
  })

  describe('remove', () => {
    it('removes the turma from items and clears selectedId when it matched', async () => {
      removeMock.mockResolvedValue(undefined)
      const store = useTurmasStore()
      store.items = [{ id: '1', nome: '3º Ano TI', slug: 'abc' }]
      store.selectedId = '1'

      await store.remove('1')

      expect(removeMock).toHaveBeenCalledWith('1')
      expect(store.items).toEqual([])
      expect(store.selectedId).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      removeMock.mockRejectedValue(new Error('delete failed'))
      const store = useTurmasStore()
      store.items = [{ id: '1', nome: '3º Ano TI', slug: 'abc' }]

      await expect(store.remove('1')).resolves.toBeUndefined()

      expect(store.error).toBe('delete failed')
      expect(store.items).toEqual([{ id: '1', nome: '3º Ano TI', slug: 'abc' }])
    })
  })
})
