import { describe, it, expect } from 'vitest'
import { DEFAULT_USERS, getInitials, createNewUser, randomColor } from './users'

describe('users', () => {
  it('defines 1 default user', () => {
    expect(DEFAULT_USERS).toHaveLength(1)
    DEFAULT_USERS.forEach((u) => {
      expect(u.id).toBeTruthy()
      expect(u.name).toBeTruthy()
      expect(u.color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
    })
  })

  it('createNewUser returns user with random color and display name', () => {
    const u = createNewUser(0)
    expect(u.id).toBeTruthy()
    expect(u.name).toBe('Алексей')
    expect(u.color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
    const u2 = createNewUser(2)
    expect(u2.name).toBe('Иван')
  })

  it('randomColor returns hsl string', () => {
    expect(randomColor()).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
  })

  it('getInitials returns first letters and ignores numbers', () => {
    expect(getInitials('Алексей')).toBe('А')
    expect(getInitials('Мария')).toBe('М')
    expect(getInitials('Иван')).toBe('И')
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Пользователь 1')).toBe('П')
    expect(getInitials('Иван Петров')).toBe('ИП')
  })
})
