import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { alunosRepository } = await import('../alunosRepository.js')

describe('alunosRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('listByTurma resolves the alunos for the given turma', async () => {
    const rows = [{ id: '1', turma_id: 't1', nome: 'Ana', foto_url: null }]
    const eq = vi.fn().mockResolvedValue({ data: rows, error: null })
    const select = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ select })
    await expect(alunosRepository.listByTurma('t1')).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('alunos')
    expect(eq).toHaveBeenCalledWith('turma_id', 't1')
  })

  it('listByTurma throws the Supabase error when the query fails', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'list failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) })
    await expect(alunosRepository.listByTurma('t1')).rejects.toThrow('list failed')
  })

  it('create resolves the full inserted row, including its id', async () => {
    const row = { id: '1', turma_id: 't1', nome: 'Ana', foto_url: null }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    fromMock.mockReturnValueOnce({ insert })
    await expect(alunosRepository.create({ turmaId: 't1', nome: 'Ana', fotoUrl: null })).resolves.toEqual(row)
    expect(insert).toHaveBeenCalledWith({ turma_id: 't1', nome: 'Ana', foto_url: null })
    expect(select).toHaveBeenCalled()
    expect(single).toHaveBeenCalled()
  })

  it('create throws the Supabase error when the insert fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    fromMock.mockReturnValueOnce({ insert: () => ({ select: () => ({ single }) }) })
    await expect(alunosRepository.create({ turmaId: 't1', nome: 'Ana', fotoUrl: null })).rejects.toThrow('insert failed')
  })

  it('update updates the aluno with the given patch', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    const update = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ update })
    await expect(alunosRepository.update('1', { nome: 'Ana Maria' })).resolves.toBeUndefined()
    expect(update).toHaveBeenCalledWith({ nome: 'Ana Maria' })
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('update throws the Supabase error when the update fails', async () => {
    fromMock.mockReturnValueOnce({
      update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'update failed' } }) })
    })
    await expect(alunosRepository.update('1', { nome: 'Ana Maria' })).rejects.toThrow('update failed')
  })

  it('remove deletes the aluno with the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    const del = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ delete: del })
    await expect(alunosRepository.remove('1')).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('remove throws the Supabase error when the delete fails', async () => {
    fromMock.mockReturnValueOnce({
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'delete failed' } }) })
    })
    await expect(alunosRepository.remove('1')).rejects.toThrow('delete failed')
  })
})
