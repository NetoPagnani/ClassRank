import { supabase } from './supabaseClient.js'

export const avaliacoesRepository = {
  async getByAlunoMateria(alunoId, materiaId) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select()
      .eq('aluno_id', alunoId)
      .eq('materia_id', materiaId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async upsert({ alunoId, materiaId, prova1, prova2, participacao }) {
    const { error } = await supabase.from('avaliacoes').upsert(
      { aluno_id: alunoId, materia_id: materiaId, prova1, prova2, participacao },
      { onConflict: 'aluno_id,materia_id' }
    )
    if (error) throw new Error(error.message)
  },

  async listByAluno(alunoId) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('materia_id, prova1, prova2, participacao')
      .eq('aluno_id', alunoId)
    if (error) throw new Error(error.message)
    return data
  }
}
