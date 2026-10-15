import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { missoesRepository } = await import('../missoesRepository.js')

describe('missoesRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('getByTurma resolves the missoes semanais for the given turma', async () => {
    const rows = [{ id: '1', turma_id: 't1', titulo: 'Missao 1', semana_referencia: 1 }]
    const eq = vi.fn().mockResolvedValue({ data: rows, error: null })
    const select = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ select })
    await expect(missoesRepository.getByTurma('t1')).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('missoes_semanais')
    expect(select).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('turma_id', 't1')
  })

  it('getByTurma throws the Supabase error when the query fails', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'getByTurma failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) })
    await expect(missoesRepository.getByTurma('t1')).rejects.toThrow('getByTurma failed')
  })

  it('upsert upserts the missao on the turma_id,semana_referencia conflict target', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
    fromMock.mockReturnValueOnce({ upsert })
    const input = {
      turmaId: 't1',
      titulo: 'Missao 1',
      descricao: 'Entregar as tarefas da semana',
      meta: 10,
      progressoAtual: 3,
      semanaReferencia: 42
    }
    await expect(missoesRepository.upsert(input)).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('missoes_semanais')
    expect(upsert).toHaveBeenCalledWith(
      {
        turma_id: 't1',
        titulo: 'Missao 1',
        descricao: 'Entregar as tarefas da semana',
        meta: 10,
        progresso_atual: 3,
        semana_referencia: 42
      },
      { onConflict: 'turma_id,semana_referencia' }
    )
  })

  it('upsert throws the Supabase error when the upsert fails', async () => {
    fromMock.mockReturnValueOnce({
      upsert: () => Promise.resolve({ data: null, error: { message: 'upsert failed' } })
    })
    await expect(
      missoesRepository.upsert({
        turmaId: 't1',
        titulo: 'Missao 1',
        descricao: null,
        meta: 10,
        progressoAtual: 0,
        semanaReferencia: 42
      })
    ).rejects.toThrow('upsert failed')
  })
})
