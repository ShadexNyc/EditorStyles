import type { Editor } from 'slate'
import { Editor as SlateEditor, Path, Range, Transforms } from 'slate'
import { Text } from 'slate'
import type { FormattedText } from '../types/slate'

const ACCEPT_FLASH_MS = 600

function isSelectionInsideSuggestion(editor: Editor): boolean {
  const selection = editor.selection
  if (!selection) return false
  const anchor = selection.anchor
  for (const [node, path] of SlateEditor.nodes(editor, {
    at: [],
    match: (n) => Text.isText(n) && !!(n as FormattedText).suggestionId,
  })) {
    const textNode = node as FormattedText
    const r: Range = { anchor: { path, offset: 0 }, focus: { path, offset: textNode.text.length } }
    if (Range.includes(r, anchor)) return true
  }
  return false
}

export function commitActiveSuggestions(editor: Editor): void {
  if (isSelectionInsideSuggestion(editor)) return
  const suggestionIds = new Set<string>()
  for (const [node] of SlateEditor.nodes(editor, {
    at: [],
    match: (n) =>
      Text.isText(n) &&
      !!((n as FormattedText).suggestionInsertion || (n as FormattedText).suggestionDeletion),
  })) {
    const id = (node as FormattedText).suggestionId
    if (id) suggestionIds.add(id)
  }
  if (suggestionIds.size === 0) return

  SlateEditor.withoutNormalizing(editor, () => {
    Transforms.setNodes(
      editor,
      { reviewInsert: true } as Partial<FormattedText>,
      {
        at: [],
        match: (n) =>
          Text.isText(n) && !!(n as FormattedText).suggestionInsertion && suggestionIds.has((n as FormattedText).suggestionId!),
        split: false,
      }
    )
    Transforms.unsetNodes(editor, ['suggestionInsertion'], {
      at: [],
      match: (n) => Text.isText(n) && !!(n as FormattedText).reviewInsert,
      split: false,
    })
    Transforms.setNodes(
      editor,
      { reviewDelete: true } as Partial<FormattedText>,
      {
        at: [],
        match: (n) =>
          Text.isText(n) && !!(n as FormattedText).suggestionDeletion && suggestionIds.has((n as FormattedText).suggestionId!),
        split: false,
      }
    )
    Transforms.unsetNodes(editor, ['suggestionDeletion'], {
      at: [],
      match: (n) => Text.isText(n) && !!(n as FormattedText).reviewDelete,
      split: false,
    })
  })
}

export function getSuggestionRangeAndTexts(
  editor: Editor,
  suggestionId: string
): { range: Range; insertionText: string; deletionText: string } | null {
  const entries: Array<{ path: Path; node: FormattedText }> = []
  for (const [node, path] of SlateEditor.nodes(editor, {
    at: [],
    match: (n) => Text.isText(n) && (n as FormattedText).suggestionId === suggestionId,
  })) {
    entries.push({ path, node: node as FormattedText })
  }
  if (entries.length === 0) return null
  entries.sort((a, b) => Path.compare(a.path, b.path))
  const first = entries[0]
  const last = entries[entries.length - 1]
  const range: Range = {
    anchor: { path: first.path, offset: 0 },
    focus: { path: last.path, offset: last.node.text.length },
  }
  let insertionText = ''
  let deletionText = ''
  for (const { node } of entries) {
    const isDeletion = !!(node.suggestionDeletion || node.reviewDelete)
    const isInsertion = !!(node.suggestionInsertion || node.reviewInsert)
    if (isInsertion || !isDeletion) insertionText += node.text
    if (isDeletion) deletionText += node.text
  }
  return { range, insertionText, deletionText }
}

export interface SuggestionInfo {
  id: string
  authorId: string | undefined
  authorColor: string
  deletionText: string
  insertionText: string
}

export function getSuggestionsList(editor: Editor): SuggestionInfo[] {
  const byId = new Map<string, { authorId: string | undefined; authorColor: string }>()
  for (const [node] of SlateEditor.nodes(editor, {
    at: [],
    match: (n) => Text.isText(n) && !!(n as FormattedText).suggestionId,
  })) {
    const t = node as FormattedText
    const id = t.suggestionId!
    if (!byId.has(id)) {
      byId.set(id, {
        authorId: t.authorId,
        authorColor: t.authorColor ?? '#666',
      })
    }
  }
  const result: SuggestionInfo[] = []
  byId.forEach((author, id) => {
    const data = getSuggestionRangeAndTexts(editor, id)
    if (data) {
      result.push({
        id,
        authorId: author.authorId,
        authorColor: author.authorColor,
        deletionText: data.deletionText,
        insertionText: data.insertionText,
      })
    }
  })
  return result.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Принять правку: предложенный текст (подсвечивался зелёным) уже в документе.
 * Снимаем с него разметку рецензии и удаляем только зачёркнутый блок (deletion).
 * Итог: предложенный текст остаётся на месте, зачёркнутый исчезает.
 */
export function acceptSuggestion(editor: Editor, suggestionId: string): boolean {
  const entries: Array<{ path: Path; node: FormattedText }> = []
  for (const [node, path] of SlateEditor.nodes(editor, {
    at: [],
    match: (n) => Text.isText(n) && (n as FormattedText).suggestionId === suggestionId,
  })) {
    entries.push({ path, node: node as FormattedText })
  }
  if (entries.length === 0) return false
  entries.sort((a, b) => Path.compare(a.path, b.path))

  const insertionPaths: Path[] = []
  let deletionRange: Range | null = null
  let firstDeletion: { path: Path; node: FormattedText } | null = null
  let lastDeletion: { path: Path; node: FormattedText } | null = null

  for (const { path, node } of entries) {
    const isDeletion = !!(node.suggestionDeletion || node.reviewDelete)
    const isInsertion = !!(node.suggestionInsertion || node.reviewInsert)
    if (isDeletion) {
      if (!firstDeletion) firstDeletion = { path, node }
      lastDeletion = { path, node }
    } else if (isInsertion) {
      insertionPaths.push(path)
    }
  }

  if (firstDeletion && lastDeletion) {
    deletionRange = {
      anchor: { path: firstDeletion.path, offset: 0 },
      focus: { path: lastDeletion.path, offset: lastDeletion.node.text.length },
    }
  }

  for (const path of insertionPaths) {
    try {
      Transforms.setNodes(editor, { acceptFlash: true } as Partial<FormattedText>, {
        at: path,
        match: (n) => Text.isText(n),
        split: false,
      })
    } catch {
      // path may be invalid
    }
  }

  SlateEditor.withoutNormalizing(editor, () => {
    for (const path of insertionPaths) {
      Transforms.unsetNodes(editor, ['suggestionId', 'suggestionInsertion', 'suggestionDeletion', 'reviewInsert', 'reviewDelete', 'authorId', 'authorColor'], {
        at: path,
        match: (n) => Text.isText(n),
        split: false,
      })
    }
    if (deletionRange) {
      Transforms.delete(editor, { at: deletionRange })
    }
  })

  setTimeout(() => {
    try {
      Transforms.unsetNodes(editor, 'acceptFlash', {
        at: [],
        match: (n) => Text.isText(n) && !!(n as FormattedText).acceptFlash,
        split: false,
      })
    } catch {
      // path may be invalid after other edits
    }
  }, ACCEPT_FLASH_MS)
  return true
}

export function rejectSuggestion(editor: Editor, suggestionId: string): boolean {
  const data = getSuggestionRangeAndTexts(editor, suggestionId)
  if (!data) return false
  const { range, deletionText } = data
  const startRef = SlateEditor.pointRef(editor, Range.start(range))
  Transforms.delete(editor, { at: range })
  const at = startRef.unref()
  if (!at) return true
  Transforms.insertNodes(editor, { text: deletionText } as FormattedText, { at })
  return true
}
