import { useCallback, useEffect, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import type { User } from '../services/users/users'
import { DEFAULT_USERS, createNewUser, MAX_USERS } from '../services/users/users'

export function useDocumentStorage(initialContent: Descendant[]) {
  const defaultUserId = DEFAULT_USERS[0]?.id
  const [content, setContent] = useState<Descendant[]>(initialContent)
  const [users, setUsersState] = useState<User[]>(DEFAULT_USERS)
  const [currentUserId, setCurrentUserIdState] = useState<string | undefined>(defaultUserId)
  const contentRef = useRef<Descendant[]>(initialContent)
  const usersRef = useRef<User[]>(DEFAULT_USERS)
  const currentUserIdRef = useRef<string | undefined>(defaultUserId)

  useEffect(() => {
    const initialUsers = DEFAULT_USERS
    const firstUserId = initialUsers[0]?.id
    contentRef.current = initialContent
    usersRef.current = initialUsers
    currentUserIdRef.current = firstUserId
    setContent(initialContent)
    setUsersState(initialUsers)
    setCurrentUserIdState(firstUserId)
  }, [initialContent])

  const save = useCallback((value: Descendant[], userId?: string, usersList?: User[]) => {
    contentRef.current = value

    if (usersList) {
      usersRef.current = usersList
      setUsersState(usersList)
    }

    if (typeof userId !== 'undefined') {
      currentUserIdRef.current = userId
      setCurrentUserIdState(userId)
    }
  }, [])

  const handleContentChange = useCallback((newValue: Descendant[]) => {
    contentRef.current = newValue
    setContent(newValue)
  }, [])

  const setCurrentUserId = useCallback((id: string | undefined) => {
    currentUserIdRef.current = id
    setCurrentUserIdState(id)
  }, [])

  const addUser = useCallback(() => {
    if (usersRef.current.length >= MAX_USERS) return
    const newUser = createNewUser(usersRef.current.length)
    const nextUsers = [...usersRef.current, newUser]
    usersRef.current = nextUsers
    currentUserIdRef.current = newUser.id
    setUsersState(nextUsers)
    setCurrentUserIdState(newUser.id)
  }, [])

  const resetDocument = useCallback((initial: Descendant[]) => {
    const initialUsers = DEFAULT_USERS
    const firstUserId = initialUsers[0]?.id
    contentRef.current = initial
    usersRef.current = initialUsers
    currentUserIdRef.current = firstUserId
    setContent(initial)
    setUsersState(initialUsers)
    setCurrentUserIdState(firstUserId)
  }, [])

  return {
    loaded: true,
    initialValue: initialContent,
    content,
    setContent,
    handleContentChange,
    currentUserId,
    setCurrentUserId,
    users,
    addUser,
    save,
    resetDocument,
  }
}
