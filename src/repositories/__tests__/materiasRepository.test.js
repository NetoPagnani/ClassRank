import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { materiasRepository } = await import('../materiasRepository.js')

describe('materiasRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('list resolves the materias returned by supabase', async () => {
    const rows = [{ id: '1', nome: 'Matemática' }]
    fromMock.mockReturnValueOnce({ select: () => Promise.resolve({ data: rows, error: null }) })
    await expect(materiasRepository.list()).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('materias')
  })

  it('list throws the Supabase error when the query fails', async () => {
    fromMock.mockReturnValueOnce({ select: () => Promise.resolve({ data: null, error: { message: 'list failed' } }) })
    await expect(materiasRepository.list()).rejects.toThrow('list failed')
  })

  it('create resolves the full inserted row, including its id', async () => {
    const row = { id: '1', nome: 'Matemática', slug: 'abc123' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    fromMock.mockReturnValueOnce({ insert })
    await expect(materiasRepository.create('Matemática')).resolves.toEqual(row)
    expect(insert).toHaveBeenCalledWith({ nome: 'Matemática' })
    expect(select).toHaveBeenCalled()
    expect(single).toHaveBeenCalled()
  })

  it('create throws the Supabase error when the insert fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    fromMock.mockReturnValueOnce({ insert: () => ({ select: () => ({ single }) }) })
    await expect(materiasRepository.create('Matemática')).rejects.toThrow('insert failed')
  })

  it('remove deletes the materia with the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    const del = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ delete: del })
    await expect(materiasRepository.remove('1')).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('remove throws the Supabase error when the delete fails', async () => {
    fromMock.mockReturnValueOnce({
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'delete failed' } }) })
    })
    await expect(materiasRepository.remove('1')).rejects.toThrow('delete failed')
  })
})
