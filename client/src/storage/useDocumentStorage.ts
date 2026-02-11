import { useCallback, useEffect, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import type { User } from '../services/users/users'
import { DEFAULT_USERS, createNewUser, MAX_USERS } from '../services/users/users'
import { DEFAULT_DOCUMENT_ID, deleteAppDatabase, getDocument, setDocument } from './db'
import type { DocumentRecord } from './db'

const SAVE_DEBOUNCE_MS = 1500

export function useDocumentStorage(initialContent: Descendant[]) {
  const [content, setContent] = useState<Descendant[] | null>(null)
  const [users, setUsersState] = useState<User[]>(DEFAULT_USERS)
  const [currentUserId, setCurrentUserIdState] = useState<string | undefined>(undefined)
  const initialRef = useRef<Descendant[] | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentUserIdRef = useRef<string | undefined>(undefined)
  const contentRef = useRef<Descendant[]>(initialContent)
  const usersRef = useRef<User[]>(DEFAULT_USERS)
  usersRef.current = users

  useEffect(() => {
    let cancelled = false
    deleteAppDatabase()
      .then(() => getDocument(DEFAULT_DOCUMENT_ID))
      .then((record) => {
        if (cancelled) return
        const docUsers =
          record?.users != null && record.users.length > 0 ? record.users : DEFAULT_USERS
        const docContent = record?.content?.length ? record.content : initialContent
        const firstUserId = docUsers[0]?.id
        const docCurrentUserId = record?.currentUserId ?? firstUserId

        initialRef.current = docContent
        contentRef.current = docContent
        usersRef.current = docUsers
        setContent(docContent)
        setUsersState(docUsers)
        setCurrentUserIdState(docCurrentUserId)
        currentUserIdRef.current = docCurrentUserId
      })
    return () => {
      cancelled = true
    }
  }, [initialContent])

  const save = useCallback(
    (value: Descendant[], userId?: string, usersList?: User[]) => {
      setDocument({
        id: DEFAULT_DOCUMENT_ID,
        content: value,
        currentUserId: userId ?? currentUserIdRef.current,
        users: usersList ?? usersRef.current,
      })
    },
    []
  )

  const debouncedSave = useCallback(
    (value: Descendant[], userId?: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        save(value, userId, usersRef.current)
        saveTimeoutRef.current = null
      }, SAVE_DEBOUNCE_MS)
    },
    [save]
  )

  const handleContentChange = useCallback(
    (newValue: Descendant[]) => {
      contentRef.current = newValue
      setContent(newValue)
      debouncedSave(newValue)
    },
    [debouncedSave]
  )

  const setCurrentUserId = useCallback((id: string | undefined) => {
    currentUserIdRef.current = id
    setCurrentUserIdState(id)
    save(contentRef.current, id, usersRef.current)
  }, [save])

  const addUser = useCallback(() => {
    if (usersRef.current.length >= MAX_USERS) return
    const newUser = createNewUser(usersRef.current.length)
    const nextUsers = [...usersRef.current, newUser]
    setUsersState(nextUsers)
    currentUserIdRef.current = newUser.id
    setCurrentUserIdState(newUser.id)
    save(contentRef.current, newUser.id, nextUsers)
  }, [save])

  const resetDocument = useCallback(
    (initial: Descendant[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      const docUsers = DEFAULT_USERS
      const firstUserId = docUsers[0]?.id
      initialRef.current = initial
      contentRef.current = initial
      usersRef.current = docUsers
      currentUserIdRef.current = firstUserId
      setContent(initial)
      setUsersState(docUsers)
      setCurrentUserIdState(firstUserId)
      save(initial, firstUserId, docUsers)
    },
    [save]
  )

  const loaded = content !== null
  const initialValue = initialRef.current ?? initialContent

  return {
    loaded,
    initialValue,
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

export type { DocumentRecord }
