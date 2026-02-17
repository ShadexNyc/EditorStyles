import { useCallback, useEffect, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import type { User } from '../services/users/users'
import { DEFAULT_USERS, createNewUser, MAX_USERS } from '../services/users/users'

export function useDocumentStorage(initialContent: Descendant[]) {
  const defaultUserId = DEFAULT_USERS[0]?.id

  // БАГ 3 ИСПРАВЛЕН: фиксируем initialContent при первом монтировании через useRef.
  // Без этого useEffect с [initialContent] в deps сбрасывал бы весь контент
  // (текст, пользователей, состояние) при каждом ре-рендере родителя, если
  // initialContent передавался как inline-литерал (нестабильная ссылка).
  const initialContentRef = useRef<Descendant[]>(initialContent)

  const [content, setContent] = useState<Descendant[]>(() => initialContentRef.current)
  const [users, setUsersState] = useState<User[]>(DEFAULT_USERS)
  const [currentUserId, setCurrentUserIdState] = useState<string | undefined>(defaultUserId)
  const contentRef = useRef<Descendant[]>(initialContentRef.current)
  const usersRef = useRef<User[]>(DEFAULT_USERS)
  const currentUserIdRef = useRef<string | undefined>(defaultUserId)

  // Эффект намеренно запускается только один раз при монтировании —
  // initialContentRef.current стабилен и не вызывает повторных сбросов.
  useEffect(() => {
    const initialUsers = DEFAULT_USERS
    const firstUserId = initialUsers[0]?.id
    const stable = initialContentRef.current
    contentRef.current = stable
    usersRef.current = initialUsers
    currentUserIdRef.current = firstUserId
    setContent(stable)
    setUsersState(initialUsers)
    setCurrentUserIdState(firstUserId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    initialValue: initialContentRef.current,
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
