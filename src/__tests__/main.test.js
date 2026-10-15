import { describe, it, expect, vi } from 'vitest'

const order = []

const PINIA_SENTINEL = { id: 'pinia' }
const ROUTER_SENTINEL = { id: 'router' }

const appMock = {
  use: vi.fn((plugin) => {
    order.push(plugin === PINIA_SENTINEL ? 'pinia:use' : 'router:use')
  }),
  mount: vi.fn(() => order.push('mount'))
}

vi.mock('vue', () => ({
  createApp: vi.fn(() => appMock)
}))

vi.mock('pinia', () => ({
  createPinia: vi.fn(() => PINIA_SENTINEL)
}))

vi.mock('../style.css', () => ({}))

vi.mock('../App.vue', () => ({ default: { name: 'App' } }))

vi.mock('../router/index.js', () => ({ default: ROUTER_SENTINEL }))

const restoreSessionMock = vi.fn(() => {
  order.push('restoreSession:start')
  // Resolves on a later macrotask, like the real getSession() call (which goes
  // through GoTrue's internal async lock queue), to prove main.js actually
  // waits for it instead of racing the router's initial navigation against it.
  return new Promise((resolve) => {
    setTimeout(() => {
      order.push('restoreSession:resolved')
      resolve()
    }, 10)
  })
})

vi.mock('../stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({ restoreSession: restoreSessionMock }))
}))

describe('main.js bootstrap', () => {
  it('awaits restoreSession before installing the router and mounting the app', async () => {
    await import('../main.js')

    expect(order).toEqual([
      'pinia:use',
      'restoreSession:start',
      'restoreSession:resolved',
      'router:use',
      'mount'
    ])
  })
})
