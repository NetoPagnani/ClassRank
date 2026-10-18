import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const signInWithPasswordMock = vi.fn()
const signUpMock = vi.fn()
const signOutMock = vi.fn()
const getSessionMock = vi.fn()
const resetPasswordForEmailMock = vi.fn()
const updateUserMock = vi.fn()

vi.mock('../../repositories/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => signInWithPasswordMock(...args),
      signUp: (...args) => signUpMock(...args),
      signOut: (...args) => signOutMock(...args),
      getSession: (...args) => getSessionMock(...args),
      resetPasswordForEmail: (...args) => resetPasswordForEmailMock(...args),
      updateUser: (...args) => updateUserMock(...args)
    }
  }
}))

const { useAuthStore } = await import('../auth.js')

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    signInWithPasswordMock.mockReset()
    signUpMock.mockReset()
    signOutMock.mockReset()
    getSessionMock.mockReset()
    resetPasswordForEmailMock.mockReset()
    updateUserMock.mockReset()
  })

  describe('signUp', () => {
    it('logs the user in directly when the session comes back confirmed', async () => {
      const user = { id: '1' }
      signUpMock.mockResolvedValue({ data: { user, session: { user } }, error: null })
      const store = useAuthStore()

      await store.signUp('a@professor.educacao.sp.gov.br', 'x')

      expect(signUpMock).toHaveBeenCalledWith({ email: 'a@professor.educacao.sp.gov.br', password: 'x' })
      expect(store.user).toEqual(user)
      expect(store.error).toBeNull()
    })

    it('sets a confirmation message and leaves user null when email confirmation is required', async () => {
      signUpMock.mockResolvedValue({ data: { user: { id: '1' }, session: null }, error: null })
      const store = useAuthStore()

      await store.signUp('a@professor.educacao.sp.gov.br', 'x')

      expect(store.user).toBeNull()
      expect(store.message).toContain('e-mail')
      expect(store.error).toBeNull()
    })

    it('sets error and does not throw on failure', async () => {
      signUpMock.mockResolvedValue({ data: {}, error: { message: 'User already registered' } })
      const store = useAuthStore()

      await expect(store.signUp('a@professor.educacao.sp.gov.br', 'x')).resolves.toBeUndefined()

      expect(store.error).toBe('User already registered')
      expect(store.user).toBeNull()
    })
  })

  describe('signIn', () => {
    it('sets user and clears error on success', async () => {
      const user = { id: '1' }
      signInWithPasswordMock.mockResolvedValue({ data: { user }, error: null })
      const store = useAuthStore()

      await store.signIn('a@a.com', 'x')

      expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: 'a@a.com', password: 'x' })
      expect(store.user).toEqual(user)
      expect(store.error).toBeNull()
    })

    it('sets error and leaves user null on failure, without throwing', async () => {
      signInWithPasswordMock.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      })
      const store = useAuthStore()

      await expect(store.signIn('a@a.com', 'wrong')).resolves.toBeUndefined()

      expect(store.user).toBeNull()
      expect(store.error).toBe('Invalid login credentials')
    })
  })

  describe('signOut', () => {
    it('clears user on success', async () => {
      signOutMock.mockResolvedValue({ error: null })
      const store = useAuthStore()
      store.user = { id: '1' }

      await store.signOut()

      expect(store.user).toBeNull()
      expect(store.error).toBeNull()
    })

    it('sets error on failure', async () => {
      signOutMock.mockResolvedValue({ error: { message: 'Network error' } })
      const store = useAuthStore()
      store.user = { id: '1' }

      await store.signOut()

      expect(store.error).toBe('Network error')
    })
  })

  describe('restoreSession', () => {
    it('sets user from an existing session', async () => {
      const user = { id: '1' }
      getSessionMock.mockResolvedValue({ data: { session: { user } } })
      const store = useAuthStore()

      await store.restoreSession()

      expect(store.user).toEqual(user)
    })

    it('leaves user null when there is no session', async () => {
      getSessionMock.mockResolvedValue({ data: { session: null } })
      const store = useAuthStore()

      await store.restoreSession()

      expect(store.user).toBeNull()
    })
  })

  describe('requestPasswordReset', () => {
    it('sends the reset link back to /redefinir-senha and shows a neutral message', async () => {
      resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null })
      const store = useAuthStore()
      await store.requestPasswordReset('ana@professor.educacao.sp.gov.br')
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith('ana@professor.educacao.sp.gov.br', {
        redirectTo: `${window.location.origin}/redefinir-senha`
      })
      expect(store.message).toMatch(/Se esse e-mail tiver conta/)
      expect(store.error).toBeNull()
    })

    it('sets error on failure, without throwing', async () => {
      resetPasswordForEmailMock.mockResolvedValue({ data: null, error: { message: 'rate limit' } })
      const store = useAuthStore()
      await store.requestPasswordReset('x@y')
      expect(store.error).toBe('rate limit')
      expect(store.message).toBeNull()
    })
  })

  describe('updatePassword', () => {
    it('saves the new password and keeps the user signed in', async () => {
      updateUserMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      const store = useAuthStore()
      await expect(store.updatePassword('novaSenha1')).resolves.toBe(true)
      expect(updateUserMock).toHaveBeenCalledWith({ password: 'novaSenha1' })
      expect(store.user).toEqual({ id: 'u1' })
    })

    it('returns false and sets error when the recovery session is missing or expired', async () => {
      updateUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'Auth session missing!' } })
      const store = useAuthStore()
      await expect(store.updatePassword('novaSenha1')).resolves.toBe(false)
      expect(store.error).toBe('Auth session missing!')
    })
  })
})
