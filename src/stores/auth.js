import { defineStore } from 'pinia'
import { supabase } from '../repositories/supabaseClient.js'

// O Supabase devolve as mensagens em inglês; as que o professor costuma ver vão traduzidas
const MENSAGENS_POR_CODIGO = {
  invalid_credentials: 'E-mail ou senha incorretos. Se não lembra a senha, use "Esqueci minha senha".',
  email_not_confirmed: 'Seu e-mail ainda não foi confirmado. Abra o link que enviamos para ele.',
  user_already_exists: 'Já existe uma conta com esse e-mail. Entre ou use "Esqueci minha senha".',
  weak_password: 'Senha muito fraca. Use pelo menos 6 caracteres.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  over_email_send_rate_limit: 'Muitos e-mails enviados em pouco tempo. Espere alguns minutos e tente de novo.'
}

const MENSAGENS_POR_TEXTO = {
  'Invalid login credentials': MENSAGENS_POR_CODIGO.invalid_credentials,
  'Email not confirmed': MENSAGENS_POR_CODIGO.email_not_confirmed,
  'User already registered': MENSAGENS_POR_CODIGO.user_already_exists
}

function traduzirErro(error) {
  return MENSAGENS_POR_CODIGO[error.code] ?? MENSAGENS_POR_TEXTO[error.message] ?? error.message
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    message: null
  }),
  actions: {
    async signUp(email, password) {
      this.error = null
      this.message = null
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          this.error = traduzirErro(error)
          return
        }
        if (data.session) {
          this.user = data.user
        } else {
          this.message = 'Conta criada! Verifique seu e-mail para confirmar antes de entrar.'
        }
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async signIn(email, password) {
      this.error = null
      this.message = null
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          this.error = traduzirErro(error)
          this.user = null
          return
        }
        this.user = data.user
      } catch (err) {
        this.error = err.message
        this.user = null
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      this.error = null
      this.loading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          this.error = traduzirErro(error)
          return
        }
        this.user = null
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    // Manda o link de redefinição; a mensagem é a mesma exista ou não a conta, para não revelar quem está cadastrado
    async requestPasswordReset(email) {
      this.error = null
      this.message = null
      this.loading = true
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/redefinir-senha`
        })
        if (error) {
          this.error = traduzirErro(error)
          return
        }
        this.message = 'Se esse e-mail tiver conta, enviamos um link para criar uma nova senha. Confira também o spam.'
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    // Usado na tela aberta pelo link do e-mail (o link já deixa o professor com uma sessão de recuperação)
    async updatePassword(password) {
      this.error = null
      this.message = null
      this.loading = true
      try {
        const { data, error } = await supabase.auth.updateUser({ password })
        if (error) {
          this.error = traduzirErro(error)
          return false
        }
        this.user = data.user
        return true
      } catch (err) {
        this.error = err.message
        return false
      } finally {
        this.loading = false
      }
    },

    async restoreSession() {
      this.error = null
      this.loading = true
      try {
        const { data } = await supabase.auth.getSession()
        this.user = data.session ? data.session.user : null
      } catch (err) {
        this.error = err.message
        this.user = null
      } finally {
        this.loading = false
      }
    }
  }
})
