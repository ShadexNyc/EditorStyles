export interface User {
  id: string
  name: string
  color: string
}

export const MAX_USERS = 5

const DEFAULT_DISPLAY_NAMES = ['Алексей', 'Мария', 'Иван', 'Ольга', 'Дмитрий']

function randomHue(): number {
  return Math.floor(Math.random() * 360)
}

export function randomColor(): string {
  return `hsl(${randomHue()}, 60%, 48%)`
}

export function createNewUser(existingCount: number = 0): User {
  const index = Math.min(existingCount, DEFAULT_DISPLAY_NAMES.length - 1)
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: DEFAULT_DISPLAY_NAMES[index],
    color: randomColor(),
  }
}

export const DEFAULT_USERS: User[] = [
  { id: 'user-default', name: DEFAULT_DISPLAY_NAMES[0], color: 'hsl(210, 65%, 50%)' },
]

/** Берёт инициалы из имени: первые буквы слов (до 2), без цифр. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((s) => s.length > 0 && !/^\d+$/.test(s))
  if (words.length === 0) return ''
  return words
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
