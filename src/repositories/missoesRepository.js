import { supabase } from './supabaseClient.js'

export const missoesRepository = {
  async getByTurma(turmaId) {
    const { data, error } = await supabase
      .from('missoes_semanais')
      .select()
      .eq('turma_id', turmaId)
    if (error) throw new Error(error.message)
    return data
  },

  async upsert({ turmaId, titulo, descricao, meta, progressoAtual, semanaReferencia }) {
    const { error } = await supabase.from('missoes_semanais').upsert(
      {
        turma_id: turmaId,
        titulo,
        descricao,
        meta,
        progresso_atual: progressoAtual,
        semana_referencia: semanaReferencia
      },
      { onConflict: 'turma_id,semana_referencia' }
    )
    if (error) throw new Error(error.message)
  }
}
