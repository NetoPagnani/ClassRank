import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { conquistasRepository } = await import('../conquistasRepository.js')

describe('conquistasRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('listCatalogo resolves all rows from the conquistas catalog', async () => {
    const rows = [
      { id: '1', codigo: 'pontual', titulo: 'Pontual' },
      { id: '2', codigo: 'dedicado', titulo: 'Dedicado' },
      { id: '3', codigo: 'colaborativo', titulo: 'Colaborativo' }
    ]
    const select = vi.fn().mockResolvedValue({ data: rows, error: null })
    fromMock.mockReturnValueOnce({ select })
    await expect(conquistasRepository.listCatalogo()).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('conquistas')
    expect(select).toHaveBeenCalled()
  })

  it('listCatalogo throws the Supabase error when the query fails', async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: 'catalogo failed' } })
    fromMock.mockReturnValueOnce({ select })
    await expect(conquistasRepository.listCatalogo()).rejects.toThrow('catalogo failed')
  })

  it('listByAluno resolves the aluno_conquistas rows joined to conquistas', async () => {
    const rows = [{ id: '1', aluno_id: 'a1', conquista_id: 'c1', conquistas: { codigo: 'pontual' } }]
    const eq = vi.fn().mockResolvedValue({ data: rows, error: null })
    const select = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ select })
    await expect(conquistasRepository.listByAluno('a1')).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('aluno_conquistas')
    expect(select).toHaveBeenCalledWith('*, conquistas(*)')
    expect(eq).toHaveBeenCalledWith('aluno_id', 'a1')
  })

  it('listByAluno throws the Supabase error when the query fails', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'listByAluno failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) })
    await expect(conquistasRepository.listByAluno('a1')).rejects.toThrow('listByAluno failed')
  })

  it('unlock looks up the conquista id by codigo, then upserts aluno_conquistas with it', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
    const eqCodigo = vi.fn(() => ({ single }))
    const selectConquista = vi.fn(() => ({ eq: eqCodigo }))
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
    fromMock.mockReturnValueOnce({ select: selectConquista })
    fromMock.mockReturnValueOnce({ upsert })

    await expect(conquistasRepository.unlock('a1', 'pontual')).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenNthCalledWith(1, 'conquistas')
    expect(selectConquista).toHaveBeenCalledWith('id')
    expect(eqCodigo).toHaveBeenCalledWith('codigo', 'pontual')
    expect(single).toHaveBeenCalled()

    expect(fromMock).toHaveBeenNthCalledWith(2, 'aluno_conquistas')
    expect(upsert).toHaveBeenCalledWith(
      { aluno_id: 'a1', conquista_id: 'c1' },
      { onConflict: 'aluno_id,conquista_id', ignoreDuplicates: true }
    )
  })

  it('unlock is idempotent: calling it twice upserts both times with the same payload', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
    const selectConquista = vi.fn(() => ({ eq: () => ({ single }) }))
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
    fromMock.mockReturnValueOnce({ select: selectConquista })
    fromMock.mockReturnValueOnce({ upsert })
    fromMock.mockReturnValueOnce({ select: selectConquista })
    fromMock.mockReturnValueOnce({ upsert })

    await conquistasRepository.unlock('a1', 'pontual')
    await conquistasRepository.unlock('a1', 'pontual')

    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      { aluno_id: 'a1', conquista_id: 'c1' },
      { onConflict: 'aluno_id,conquista_id', ignoreDuplicates: true }
    )
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      { aluno_id: 'a1', conquista_id: 'c1' },
      { onConflict: 'aluno_id,conquista_id', ignoreDuplicates: true }
    )
  })

  it('unlock throws the Supabase error when the codigo lookup fails, without upserting', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'codigo lookup failed' } })
    const selectConquista = vi.fn(() => ({ eq: () => ({ single }) }))
    const upsert = vi.fn()
    fromMock.mockReturnValueOnce({ select: selectConquista })
    fromMock.mockReturnValueOnce({ upsert })

    await expect(conquistasRepository.unlock('a1', 'pontual')).rejects.toThrow('codigo lookup failed')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('unlock throws the Supabase error when the upsert fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null })
    const selectConquista = vi.fn(() => ({ eq: () => ({ single }) }))
    const upsert = vi.fn().mockResolvedValue({ data: null, error: { message: 'upsert failed' } })
    fromMock.mockReturnValueOnce({ select: selectConquista })
    fromMock.mockReturnValueOnce({ upsert })

    await expect(conquistasRepository.unlock('a1', 'pontual')).rejects.toThrow('upsert failed')
  })
})
