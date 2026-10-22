import { supabase } from './supabaseClient.js'

async function callRpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data
}

export const publicRepository = {
  async getTurmaBySlug(slug) {
    const rows = await callRpc('rpc_turma_publica', { p_slug: slug })
    return rows?.[0] ?? null
  },

  async getRankingPublico(slug, materiaId) {
    return callRpc('rpc_ranking_publico', { p_slug: slug, p_materia_id: materiaId })
  },

  async getMissaoPublica(slug) {
    const rows = await callRpc('rpc_missao_publica', { p_slug: slug })
    return rows?.[0] ?? null
  },

  async getMateriasPublicas(slug) {
    return callRpc('rpc_materias_turma_publica', { p_slug: slug })
  }
}
