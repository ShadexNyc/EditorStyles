import { createContext, type ReactNode } from 'react'
import type { User } from '../services/users/users'

export interface DocumentContextValue {
  currentUserId: string | undefined
  setCurrentUserId: (id: string | undefined) => void
  users: User[]
  addUser: () => void
}

export const DocumentContext = createContext<DocumentContextValue>({
  currentUserId: undefined,
  setCurrentUserId: () => {},
  users: [],
  addUser: () => {},
})

export function DocumentProvider({
  currentUserId,
  setCurrentUserId,
  users,
  addUser,
  children,
}: DocumentContextValue & { children: ReactNode }) {
  return (
    <DocumentContext.Provider value={{ currentUserId, setCurrentUserId, users, addUser }}>
      {children}
    </DocumentContext.Provider>
  )
}
