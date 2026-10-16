import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { turmaMateriasRepository } = await import('../turmaMateriasRepository.js')

describe('turmaMateriasRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('listByTurma resolves the materia_id rows for the given turma', async () => {
    const rows = [{ materia_id: 'm1' }, { materia_id: 'm2' }]
    const eq = vi.fn().mockResolvedValue({ data: rows, error: null })
    const select = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ select })
    await expect(turmaMateriasRepository.listByTurma('t1')).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('turma_materias')
    expect(eq).toHaveBeenCalledWith('turma_id', 't1')
  })

  it('listByTurma throws the Supabase error when the query fails', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'list failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) })
    await expect(turmaMateriasRepository.listByTurma('t1')).rejects.toThrow('list failed')
  })

  it('link upserts the turma_id,materia_id pair ignoring duplicates', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
    fromMock.mockReturnValueOnce({ upsert })
    await expect(turmaMateriasRepository.link('t1', 'm1')).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('turma_materias')
    expect(upsert).toHaveBeenCalledWith(
      { turma_id: 't1', materia_id: 'm1' },
      { onConflict: 'turma_id,materia_id', ignoreDuplicates: true }
    )
  })

  it('link throws the Supabase error when the upsert fails', async () => {
    fromMock.mockReturnValueOnce({
      upsert: () => Promise.resolve({ data: null, error: { message: 'link failed' } })
    })
    await expect(turmaMateriasRepository.link('t1', 'm1')).rejects.toThrow('link failed')
  })

  it('unlink deletes the turma_id,materia_id pair', async () => {
    const eqMateria = vi.fn().mockResolvedValue({ data: null, error: null })
    const eqTurma = vi.fn(() => ({ eq: eqMateria }))
    const del = vi.fn(() => ({ eq: eqTurma }))
    fromMock.mockReturnValueOnce({ delete: del })
    await expect(turmaMateriasRepository.unlink('t1', 'm1')).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('turma_materias')
    expect(eqTurma).toHaveBeenCalledWith('turma_id', 't1')
    expect(eqMateria).toHaveBeenCalledWith('materia_id', 'm1')
  })

  it('unlink throws the Supabase error when the delete fails', async () => {
    fromMock.mockReturnValueOnce({
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'unlink failed' } }) }) })
    })
    await expect(turmaMateriasRepository.unlink('t1', 'm1')).rejects.toThrow('unlink failed')
  })
})
