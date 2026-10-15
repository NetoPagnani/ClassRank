import { supabase } from './supabaseClient.js'

export const turmasRepository = {
  async list() {
    const { data, error } = await supabase.from('turmas').select()
    if (error) throw new Error(error.message)
    return data
  },

  async create(nome) {
    const { data, error } = await supabase.from('turmas').insert({ nome }).select().single()
    if (error) throw new Error(error.message)
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('turmas').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
