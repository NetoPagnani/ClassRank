import { supabase } from './supabaseClient.js'

export const storageRepository = {
  async uploadAvatar(alunoId, file) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    const path = `${user.id}/${alunoId}-${file.name}`

    const bucket = supabase.storage.from('avatars')
    const { error } = await bucket.upload(path, file)
    if (error) throw new Error(error.message)

    const { data } = bucket.getPublicUrl(path)
    return data.publicUrl
  }
}
