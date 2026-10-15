import { supabase } from './supabaseClient.js'

export const conquistasRepository = {
  async listCatalogo() {
    const { data, error } = await supabase.from('conquistas').select()
    if (error) throw new Error(error.message)
    return data
  },

  async listByAluno(alunoId) {
    const { data, error } = await supabase
      .from('aluno_conquistas')
      .select('*, conquistas(*)')
      .eq('aluno_id', alunoId)
    if (error) throw new Error(error.message)
    return data
  },

  async unlock(alunoId, conquistaCodigo) {
    const { data: conquista, error: lookupError } = await supabase
      .from('conquistas')
      .select('id')
      .eq('codigo', conquistaCodigo)
      .single()
    if (lookupError) throw new Error(lookupError.message)

    const { error } = await supabase
      .from('aluno_conquistas')
      .upsert(
        { aluno_id: alunoId, conquista_id: conquista.id },
        { onConflict: 'aluno_id,conquista_id', ignoreDuplicates: true }
      )
    if (error) throw new Error(error.message)
  }
}
