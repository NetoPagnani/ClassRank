import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { turmasRepository } = await import('../turmasRepository.js')

describe('turmasRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('list resolves the turmas returned by supabase', async () => {
    const rows = [{ id: '1', nome: '3º Ano TI' }]
    fromMock.mockReturnValueOnce({ select: () => Promise.resolve({ data: rows, error: null }) })
    await expect(turmasRepository.list()).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('turmas')
  })

  it('list throws the Supabase error when the query fails', async () => {
    fromMock.mockReturnValueOnce({ select: () => Promise.resolve({ data: null, error: { message: 'list failed' } }) })
    await expect(turmasRepository.list()).rejects.toThrow('list failed')
  })

  it('create resolves the full inserted row, including its id', async () => {
    const row = { id: '1', nome: '3º Ano TI', slug: 'abc123' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    fromMock.mockReturnValueOnce({ insert })
    await expect(turmasRepository.create('3º Ano TI')).resolves.toEqual(row)
    expect(insert).toHaveBeenCalledWith({ nome: '3º Ano TI' })
    expect(select).toHaveBeenCalled()
    expect(single).toHaveBeenCalled()
  })

  it('create throws the Supabase error when the insert fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    fromMock.mockReturnValueOnce({ insert: () => ({ select: () => ({ single }) }) })
    await expect(turmasRepository.create('3º Ano TI')).rejects.toThrow('insert failed')
  })

  it('remove deletes the turma with the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    const del = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ delete: del })
    await expect(turmasRepository.remove('1')).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('remove throws the Supabase error when the delete fails', async () => {
    fromMock.mockReturnValueOnce({
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'delete failed' } }) })
    })
    await expect(turmasRepository.remove('1')).rejects.toThrow('delete failed')
  })
})
