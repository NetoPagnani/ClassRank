import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const signInWithPasswordMock = vi.fn()
const signOutMock = vi.fn()
const getSessionMock = vi.fn()

vi.mock('../../repositories/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => signInWithPasswordMock(...args),
      signOut: (...args) => signOutMock(...args),
      getSession: (...args) => getSessionMock(...args)
    }
  }
}))

const { useAuthStore } = await import('../auth.js')

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    signInWithPasswordMock.mockReset()
    signOutMock.mockReset()
    getSessionMock.mockReset()
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

      await expect(store.signIn('a@a.com', 'wrong')).resolves.not.toThrow()

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
})
