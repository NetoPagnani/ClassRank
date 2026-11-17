import { createClient } from '@supabase/supabase-js'

// Lido antes do createClient, que apaga o #access_token...&type=recovery da URL ao entrar com o link.
// Se o Supabase mandar o link para outra página (endereço fora da lista de Redirect URLs),
// o app ainda sabe que precisa abrir a tela de nova senha.
export const chegouPeloLinkDeRecuperacao = window.location.hash.includes('type=recovery')

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
