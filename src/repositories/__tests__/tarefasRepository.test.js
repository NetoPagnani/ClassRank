import { describe, it, expect, vi, beforeEach } from 'vitest'

const fromMock = vi.fn()
vi.mock('../supabaseClient.js', () => ({
  supabase: { from: (...args) => fromMock(...args) }
}))

const { tarefasRepository } = await import('../tarefasRepository.js')

describe('tarefasRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('listByTurmaMateria resolves the tarefas for the given turma and materia', async () => {
    const rows = [{ id: '1', turma_id: 't1', materia_id: 'm1', titulo: 'Prova 1' }]
    const eqMateria = vi.fn().mockResolvedValue({ data: rows, error: null })
    const eqTurma = vi.fn(() => ({ eq: eqMateria }))
    const select = vi.fn(() => ({ eq: eqTurma }))
    fromMock.mockReturnValueOnce({ select })
    await expect(tarefasRepository.listByTurmaMateria('t1', 'm1')).resolves.toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith('tarefas')
    expect(eqTurma).toHaveBeenCalledWith('turma_id', 't1')
    expect(eqMateria).toHaveBeenCalledWith('materia_id', 'm1')
  })

  it('listByTurmaMateria throws the Supabase error when the query fails', async () => {
    const eqMateria = vi.fn().mockResolvedValue({ data: null, error: { message: 'list failed' } })
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ eq: eqMateria }) }) })
    await expect(tarefasRepository.listByTurmaMateria('t1', 'm1')).rejects.toThrow('list failed')
  })

  it('create resolves the full inserted row, including its id', async () => {
    const row = {
      id: '1',
      turma_id: 't1',
      materia_id: 'm1',
      titulo: 'Prova 1',
      cmsp_link: 'https://example.com',
      data_entrega: '2026-10-20',
      nota_maxima: 10
    }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    fromMock.mockReturnValueOnce({ insert })
    const input = {
      turmaId: 't1',
      materiaId: 'm1',
      titulo: 'Prova 1',
      cmspLink: 'https://example.com',
      dataEntrega: '2026-10-20',
      notaMaxima: 10
    }
    await expect(tarefasRepository.create(input)).resolves.toEqual(row)
    expect(fromMock).toHaveBeenCalledWith('tarefas')
    expect(insert).toHaveBeenCalledWith({
      turma_id: 't1',
      materia_id: 'm1',
      titulo: 'Prova 1',
      cmsp_link: 'https://example.com',
      data_entrega: '2026-10-20',
      nota_maxima: 10
    })
    expect(select).toHaveBeenCalled()
    expect(single).toHaveBeenCalled()
  })

  it('create throws the Supabase error when the insert fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    fromMock.mockReturnValueOnce({ insert: () => ({ select: () => ({ single }) }) })
    await expect(
      tarefasRepository.create({
        turmaId: 't1',
        materiaId: 'm1',
        titulo: 'Prova 1',
        cmspLink: null,
        dataEntrega: '2026-10-20',
        notaMaxima: 10
      })
    ).rejects.toThrow('insert failed')
  })

  it('remove deletes the tarefa with the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    const del = vi.fn(() => ({ eq }))
    fromMock.mockReturnValueOnce({ delete: del })
    await expect(tarefasRepository.remove('1')).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('remove throws the Supabase error when the delete fails', async () => {
    fromMock.mockReturnValueOnce({
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'delete failed' } }) })
    })
    await expect(tarefasRepository.remove('1')).rejects.toThrow('delete failed')
  })

  it('saveNota upserts the nota on the aluno_id,tarefa_id conflict target', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
    fromMock.mockReturnValueOnce({ upsert })
    const entregueEm = '2026-10-19T12:00:00Z'
    await expect(tarefasRepository.saveNota('a1', 'ta1', 8.5, entregueEm)).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('notas_tarefas')
    expect(upsert).toHaveBeenCalledWith(
      { aluno_id: 'a1', tarefa_id: 'ta1', nota: 8.5, entregue_em: entregueEm },
      { onConflict: 'aluno_id,tarefa_id' }
    )
  })

  it('saveNota throws the Supabase error when the upsert fails', async () => {
    fromMock.mockReturnValueOnce({
      upsert: () => Promise.resolve({ data: null, error: { message: 'upsert failed' } })
    })
    await expect(tarefasRepository.saveNota('a1', 'ta1', 8.5, null)).rejects.toThrow('upsert failed')
  })
})
