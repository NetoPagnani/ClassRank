import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const listMock = vi.fn()
const createMock = vi.fn()

vi.mock('../../repositories/materiasRepository.js', () => ({
  materiasRepository: {
    list: (...args) => listMock(...args),
    create: (...args) => createMock(...args)
  }
}))

const { useMateriasStore } = await import('../materias.js')

describe('useMateriasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listMock.mockReset()
    createMock.mockReset()
  })

  describe('fetchAll', () => {
    it('populates items on success', async () => {
      const materias = [{ id: '1', nome: 'Matemática', slug: 'abc' }]
      listMock.mockResolvedValue(materias)
      const store = useMateriasStore()

      await store.fetchAll()

      expect(listMock).toHaveBeenCalled()
      expect(store.items).toEqual(materias)
      expect(store.error).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      listMock.mockRejectedValue(new Error('network down'))
      const store = useMateriasStore()

      await expect(store.fetchAll()).resolves.toBeUndefined()

      expect(store.error).toBe('network down')
    })
  })

  describe('add', () => {
    it('pushes the new row into items and returns it', async () => {
      const row = { id: '1', nome: 'Matemática', slug: 'abc' }
      createMock.mockResolvedValue(row)
      const store = useMateriasStore()

      const result = await store.add('Matemática')

      expect(createMock).toHaveBeenCalledWith('Matemática')
      expect(store.items).toContainEqual(row)
      expect(result).toBe(row)
    })

    it('sets error and does not throw on failure', async () => {
      createMock.mockRejectedValue(new Error('duplicate nome'))
      const store = useMateriasStore()

      await expect(store.add('Matemática')).resolves.toBeUndefined()

      expect(store.error).toBe('duplicate nome')
      expect(store.items).toEqual([])
    })
  })
})
