import { openDB } from 'idb'
import type { Descendant } from 'slate'
import type { User } from '../services/users/users'

const DB_NAME = 'editer-db'
const DB_VERSION = 1
const STORE_DOCUMENTS = 'documents'

export interface DocumentRecord {
  id: string
  content: Descendant[]
  currentUserId?: string
  users?: User[]
  updatedAt: number
}

let dbPromise: ReturnType<typeof openDB> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
          db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  const db = await getDB()
  return db.get(STORE_DOCUMENTS, id)
}

export async function setDocument(record: Omit<DocumentRecord, 'updatedAt'>): Promise<void> {
  const db = await getDB()
  await db.put(STORE_DOCUMENTS, {
    ...record,
    updatedAt: Date.now(),
  })
}

export const DEFAULT_DOCUMENT_ID = 'default'
