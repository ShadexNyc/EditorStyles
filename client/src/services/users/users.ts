export interface User {
  id: string
  name: string
  color: string
}

export const MAX_USERS = 5

function randomHue(): number {
  return Math.floor(Math.random() * 360)
}

export function randomColor(): string {
  return `hsl(${randomHue()}, 60%, 48%)`
}

export function createNewUser(existingCount: number = 0): User {
  const n = existingCount + 1
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: `Пользователь ${n}`,
    color: randomColor(),
  }
}

export const DEFAULT_USERS: User[] = [
  { id: 'user-default', name: 'Пользователь 1', color: 'hsl(210, 65%, 50%)' },
]

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
