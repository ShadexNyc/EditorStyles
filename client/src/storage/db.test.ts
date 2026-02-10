import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDocument, setDocument, DEFAULT_DOCUMENT_ID } from './db'

vi.mock('idb', () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      put: vi.fn(),
    })
  ),
}))

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports DEFAULT_DOCUMENT_ID', () => {
    expect(DEFAULT_DOCUMENT_ID).toBe('default')
  })

  it('getDocument and setDocument are functions', () => {
    expect(typeof getDocument).toBe('function')
    expect(typeof setDocument).toBe('function')
  })
})
