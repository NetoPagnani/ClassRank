import { supabase } from './supabaseClient.js'

export const materiasRepository = {
  async list() {
    const { data, error } = await supabase.from('materias').select()
    if (error) throw new Error(error.message)
    return data
  },

  async create(nome) {
    const { data, error } = await supabase.from('materias').insert({ nome }).select().single()
    if (error) throw new Error(error.message)
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('materias').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
