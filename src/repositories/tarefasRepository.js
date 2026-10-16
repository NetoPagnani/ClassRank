import { supabase } from './supabaseClient.js'

export const tarefasRepository = {
  async listByTurmaMateria(turmaId, materiaId) {
    const { data, error } = await supabase
      .from('tarefas')
      .select()
      .eq('turma_id', turmaId)
      .eq('materia_id', materiaId)
    if (error) throw new Error(error.message)
    return data
  },

  async create({ turmaId, materiaId, titulo, cmspLink, dataEntrega, notaMaxima }) {
    const { data, error } = await supabase
      .from('tarefas')
      .insert({
        turma_id: turmaId,
        materia_id: materiaId,
        titulo,
        cmsp_link: cmspLink,
        data_entrega: dataEntrega,
        nota_maxima: notaMaxima
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async saveNota(alunoId, tarefaId, nota, entregueEm) {
    const { error } = await supabase.from('notas_tarefas').upsert(
      { aluno_id: alunoId, tarefa_id: tarefaId, nota, entregue_em: entregueEm },
      { onConflict: 'aluno_id,tarefa_id' }
    )
    if (error) throw new Error(error.message)
  },

  async listNotasByTarefas(tarefaIds) {
    if (tarefaIds.length === 0) return []
    const { data, error } = await supabase
      .from('notas_tarefas')
      .select('aluno_id, tarefa_id, nota, entregue_em')
      .in('tarefa_id', tarefaIds)
    if (error) throw new Error(error.message)
    return data
  }
}
