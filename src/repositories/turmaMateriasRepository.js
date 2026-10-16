import { supabase } from './supabaseClient.js'

export const turmaMateriasRepository = {
  async listByTurma(turmaId) {
    const { data, error } = await supabase
      .from('turma_materias')
      .select('materia_id')
      .eq('turma_id', turmaId)
    if (error) throw new Error(error.message)
    return data
  },

  async link(turmaId, materiaId) {
    const { error } = await supabase.from('turma_materias').upsert(
      { turma_id: turmaId, materia_id: materiaId },
      { onConflict: 'turma_id,materia_id', ignoreDuplicates: true }
    )
    if (error) throw new Error(error.message)
  },

  async unlink(turmaId, materiaId) {
    const { error } = await supabase
      .from('turma_materias')
      .delete()
      .eq('turma_id', turmaId)
      .eq('materia_id', materiaId)
    if (error) throw new Error(error.message)
  }
}
