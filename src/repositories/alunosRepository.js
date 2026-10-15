import { supabase } from './supabaseClient.js'

export const alunosRepository = {
  async listByTurma(turmaId) {
    const { data, error } = await supabase.from('alunos').select().eq('turma_id', turmaId)
    if (error) throw new Error(error.message)
    return data
  },

  async create({ turmaId, nome, fotoUrl }) {
    const { data, error } = await supabase
      .from('alunos')
      .insert({ turma_id: turmaId, nome, foto_url: fotoUrl })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id, patch) {
    const { error } = await supabase.from('alunos').update(patch).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async remove(id) {
    const { error } = await supabase.from('alunos').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
