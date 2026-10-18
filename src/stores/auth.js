import { defineStore } from 'pinia'
import { supabase } from '../repositories/supabaseClient.js'

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
          this.error = error.message
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
          this.error = error.message
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
          this.error = error.message
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
          this.error = error.message
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
          this.error = error.message
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
