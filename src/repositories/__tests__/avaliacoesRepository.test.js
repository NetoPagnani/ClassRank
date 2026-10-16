import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { avaliacoesRepository } = await import('../avaliacoesRepository.js')

describe('avaliacoesRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('getByAlunoMateria resolves the avaliacao for the given aluno and materia', async () => {
    const row = { id: '1', aluno_id: 'a1', materia_id: 'm1', prova1: 7, prova2: 8, participacao: 9 }
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
    const eqMateria = vi.fn(() => ({ maybeSingle }))
    const eqAluno = vi.fn(() => ({ eq: eqMateria }))
    const select = vi.fn(() => ({ eq: eqAluno }))
    fromMock.mockReturnValueOnce({ select })
    await expect(avaliacoesRepository.getByAlunoMateria('a1', 'm1')).resolves.toEqual(row)
    expect(fromMock).toHaveBeenCalledWith('avaliacoes')
    expect(eqAluno).toHaveBeenCalledWith('aluno_id', 'a1')
    expect(eqMateria).toHaveBeenCalledWith('materia_id', 'm1')
  })

  it('getByAlunoMateria throws the Supabase error when the query fails', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'get failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) })
    await expect(avaliacoesRepository.getByAlunoMateria('a1', 'm1')).rejects.toThrow('get failed')
  })

  it('upsert writes the provas and participacao on the aluno_id,materia_id conflict target', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
    fromMock.mockReturnValueOnce({ upsert })
    await expect(
      avaliacoesRepository.upsert({ alunoId: 'a1', materiaId: 'm1', prova1: 7, prova2: 8, participacao: 9 })
    ).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('avaliacoes')
    expect(upsert).toHaveBeenCalledWith(
      { aluno_id: 'a1', materia_id: 'm1', prova1: 7, prova2: 8, participacao: 9 },
      { onConflict: 'aluno_id,materia_id' }
    )
  })

  it('upsert throws the Supabase error when the upsert fails', async () => {
    fromMock.mockReturnValueOnce({
      upsert: () => Promise.resolve({ data: null, error: { message: 'upsert failed' } })
    })
    await expect(
      avaliacoesRepository.upsert({ alunoId: 'a1', materiaId: 'm1', prova1: 7, prova2: null, participacao: null })
    ).rejects.toThrow('upsert failed')
  })

  it('listByAluno resolves every avaliacao for the given aluno across materias', async () => {
    const rows = [{ materia_id: 'm1', prova1: 7, prova2: 8, participacao: 9 }]
    const eq = vi.fn().mockResolvedValue({ data: rows, error: null })
    const select = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ select })
    await expect(avaliacoesRepository.listByAluno('a1')).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('avaliacoes')
    expect(eq).toHaveBeenCalledWith('aluno_id', 'a1')
  })

  it('listByAluno throws the Supabase error when the query fails', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'list failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) })
    await expect(avaliacoesRepository.listByAluno('a1')).rejects.toThrow('list failed')
  })
})
