import { describe, it, expect, vi } from 'vitest'

const rpcMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { rpc: (...args) => rpcMock(...args) }
}))

const { publicRepository } = await import('../publicRepository.js')

describe('publicRepository', () => {
  it('getTurmaBySlug resolves the matching row', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: '1', nome: '3º Ano TI' }], error: null })
    await expect(publicRepository.getTurmaBySlug('abc')).resolves.toEqual({ id: '1', nome: '3º Ano TI' })
    expect(rpcMock).toHaveBeenCalledWith('rpc_turma_publica', { p_slug: 'abc' })
  })

  it('getTurmaBySlug resolves null when the slug does not exist', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null })
    await expect(publicRepository.getTurmaBySlug('nope')).resolves.toBeNull()
  })

  it('getRankingPublico resolves the ranking rows', async () => {
    const rows = [{ aluno_id: '1', nome: 'Ana', foto_url: null, nota_final: 8 }]
    rpcMock.mockResolvedValueOnce({ data: rows, error: null })
    await expect(publicRepository.getRankingPublico('abc', 'm1')).resolves.toEqual(rows)
    expect(rpcMock).toHaveBeenCalledWith('rpc_ranking_publico', { p_slug: 'abc', p_materia_id: 'm1' })
  })

  it('getRankingPublico resolves an empty array when there is nothing to rank', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null })
    await expect(publicRepository.getRankingPublico('abc', 'm1')).resolves.toEqual([])
  })

  it('getMissaoPublica resolves the current mission', async () => {
    const row = { titulo: 'Missão', descricao: 'Entregar tudo', meta: 5, progresso_atual: 3 }
    rpcMock.mockResolvedValueOnce({ data: [row], error: null })
    await expect(publicRepository.getMissaoPublica('abc')).resolves.toEqual(row)
    expect(rpcMock).toHaveBeenCalledWith('rpc_missao_publica', { p_slug: 'abc' })
  })

  it('getMissaoPublica resolves null when there is no mission set', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null })
    await expect(publicRepository.getMissaoPublica('abc')).resolves.toBeNull()
  })

  it('throws the Supabase error when an RPC call fails', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'network error' } })
    await expect(publicRepository.getTurmaBySlug('abc')).rejects.toThrow('network error')
  })
})
