import type { MutableRefObject } from 'react'
import type { Editor, Range as SlateRange, Point } from 'slate'
import { Editor as SlateEditor, Element, Path, Range, Transforms } from 'slate'
import { Text } from 'slate'
import type { Descendant } from 'slate'
import type { FormattedText } from '../types/slate'
import type { ReviewPluginRef } from '../services/review/ReviewContext'

function generateSuggestionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isSelectionEntirelyWithinInsertion(editor: Editor): boolean {
  const selection = editor.selection
  if (!selection) return false
  if (Range.isCollapsed(selection)) {
    try {
      const [node] = SlateEditor.node(editor, selection.anchor)
      if (!Text.isText(node)) return false
      const t = node as FormattedText
      return !!(t.suggestionInsertion && t.suggestionId)
    } catch {
      return false
    }
  }
  let suggestionId: string | null = null
  for (const [node] of SlateEditor.nodes(editor, { at: selection, match: Text.isText })) {
    const t = node as FormattedText
    if (!t.suggestionInsertion || !t.suggestionId) return false
    if (suggestionId === null) suggestionId = t.suggestionId
    else if (suggestionId !== t.suggestionId) return false
  }
  return suggestionId !== null
}

function getSelectionEntirelyWithinDeletionSuggestionId(editor: Editor): string | null {
  const selection = editor.selection
  if (!selection || Range.isCollapsed(selection)) return null
  let suggestionId: string | null = null
  for (const [node] of SlateEditor.nodes(editor, { at: selection, match: Text.isText })) {
    const t = node as FormattedText
    if (!t.suggestionDeletion || !t.suggestionId) return null
    if (suggestionId === null) suggestionId = t.suggestionId
    else if (suggestionId !== t.suggestionId) return null
  }
  return suggestionId
}

function collectTextNodesFromFragment(fragment: Descendant[]): FormattedText[] {
  const out: FormattedText[] = []
  for (const node of fragment) {
    if (Text.isText(node)) {
      out.push(node as FormattedText)
    } else if (Element.isElement(node) && node.children) {
      out.push(...collectTextNodesFromFragment(node.children as Descendant[]))
    }
  }
  return out
}

function getPointAfterLastNodeOfSuggestionInBlock(
  editor: Editor,
  suggestionId: string,
  blockPath: Path
): { path: Path; offset: number } | null {
  const entries: Array<{ path: Path }> = []
  for (const [, path] of SlateEditor.nodes(editor, {
    at: blockPath,
    match: (n) => Text.isText(n) && (n as FormattedText).suggestionId === suggestionId,
  })) {
    entries.push({ path })
  }
  if (entries.length === 0) return null
  entries.sort((a, b) => Path.compare(a.path, b.path))
  const lastPath = entries[entries.length - 1].path
  const [lastNode] = SlateEditor.node(editor, lastPath)
  const offset = Text.isText(lastNode) ? (lastNode as FormattedText).text.length : 0
  return { path: lastPath, offset }
}

function markRangeAsDeletion(
  editor: Editor,
  range: SlateRange,
  suggestionId: string,
  userId?: string,
  userColor?: string
): void {
  Transforms.setNodes(
    editor,
    {
      suggestionDeletion: true,
      suggestionMode: 'delete',
      suggestionId,
      authorId: userId,
      authorColor: userColor,
    } as Record<string, unknown>,
    {
      at: range,
      match: (n) => Text.isText(n),
      split: true,
    }
  )
}

function insertInsertionAtPoint(
  editor: Editor,
  at: Point,
  text: string,
  suggestionId: string,
  userId?: string,
  userColor?: string
): void {
  if (text.length === 0) return
  const insertNode: FormattedText = {
    text,
    suggestionInsertion: true,
    suggestionMode: 'insert',
    suggestionId,
    authorId: userId,
    authorColor: userColor,
  }
  Transforms.insertNodes(editor, insertNode as { text: string; [k: string]: unknown }, { at })
  Transforms.select(editor, { path: at.path, offset: at.offset + text.length })
}

function createReplacementSuggestion(editor: Editor, text: string, userId?: string, userColor?: string): boolean {
  const selection = editor.selection
  if (!selection || Range.isCollapsed(selection)) return false
  const suggestionId = generateSuggestionId()
  const parentDeletionId = getSelectionEntirelyWithinDeletionSuggestionId(editor)

  if (parentDeletionId != null) {
    const blockPath = selection.anchor.path.slice(0, -1)
    const fragment = SlateEditor.fragment(editor, selection)
    const textNodes = collectTextNodesFromFragment(fragment)
    const deletionNodes: FormattedText[] = textNodes.map((node) => {
      const { text: nodeText, bold, italic, underline, fontSize, color, highlight } = node
      return {
        text: nodeText,
        ...(bold && { bold: true }),
        ...(italic && { italic: true }),
        ...(underline && { underline: true }),
        ...(fontSize && { fontSize }),
        ...(color && { color }),
        ...(highlight && { highlight }),
        suggestionDeletion: true,
        suggestionMode: 'delete',
        suggestionId,
        authorId: userId,
        authorColor: userColor,
      } as FormattedText
    })
    Transforms.delete(editor, { at: selection })
    const after = getPointAfterLastNodeOfSuggestionInBlock(editor, parentDeletionId, blockPath)
    const insertAt = after ?? { path: blockPath.concat(0), offset: 0 }
    const insertNode: FormattedText = {
      text,
      suggestionInsertion: true,
      suggestionMode: 'insert',
      suggestionId,
      authorId: userId,
      authorColor: userColor,
    }
    Transforms.insertNodes(editor, [insertNode, ...deletionNodes] as { text: string; [k: string]: unknown }[], {
      at: insertAt,
    })
    Transforms.select(editor, { path: insertAt.path, offset: insertAt.offset + text.length })
    return true
  }

  const start = Range.start(selection)
  const startRef = SlateEditor.pointRef(editor, start)
  markRangeAsDeletion(editor, selection, suggestionId, userId, userColor)
  const at = startRef.unref()
  if (at) {
    insertInsertionAtPoint(editor, at, text, suggestionId, userId, userColor)
  }
  return true
}

export function withReview<T extends Editor>(
  editor: T,
  pluginRef: MutableRefObject<ReviewPluginRef | null>
): T {
  const { insertText, deleteFragment, deleteBackward, deleteForward } = editor

  const getReviewRuntime = (): { enabled: boolean; userId?: string; userColor?: string } => {
    const ref = pluginRef.current
    if (!ref || !ref.getReviewMode()) return { enabled: false }
    const userId = ref.getCurrentUserId()
    return { enabled: true, userId, userColor: userId ? ref.getUserColor(userId) : undefined }
  }

  editor.insertText = (text: string) => {
    if (text.length === 0) {
      insertText(text)
      return
    }

    const rt = getReviewRuntime()
    const selection = editor.selection
    if (!rt.enabled || !selection) {
      insertText(text)
      return
    }

    if (isSelectionEntirelyWithinInsertion(editor)) {
      insertText(text)
      return
    }

    SlateEditor.withoutNormalizing(editor, () => {
      if (Range.isCollapsed(selection)) {
        const suggestionId = generateSuggestionId()
        insertInsertionAtPoint(editor, selection.anchor, text, suggestionId, rt.userId, rt.userColor)
        return
      }
      createReplacementSuggestion(editor, text, rt.userId, rt.userColor)
    })
  }

  editor.deleteFragment = (...args) => {
    const rt = getReviewRuntime()
    const selection = editor.selection
    if (!rt.enabled || !selection || Range.isCollapsed(selection)) {
      deleteFragment(...args)
      return
    }
    const suggestionId = generateSuggestionId()
    SlateEditor.withoutNormalizing(editor, () => {
      markRangeAsDeletion(editor, selection, suggestionId, rt.userId, rt.userColor)
      Transforms.collapse(editor, { edge: 'start' })
    })
  }

  editor.deleteBackward = (unit) => {
    const rt = getReviewRuntime()
    const selection = editor.selection
    if (!rt.enabled || !selection) {
      deleteBackward(unit)
      return
    }

    if (!Range.isCollapsed(selection)) {
      const suggestionId = generateSuggestionId()
      SlateEditor.withoutNormalizing(editor, () => {
        markRangeAsDeletion(editor, selection, suggestionId, rt.userId, rt.userColor)
        Transforms.collapse(editor, { edge: 'start' })
      })
      return
    }

    const before = SlateEditor.before(editor, selection.anchor, { unit })
    if (!before) {
      deleteBackward(unit)
      return
    }
    const suggestionId = generateSuggestionId()
    const range: SlateRange = { anchor: before, focus: selection.anchor }
    SlateEditor.withoutNormalizing(editor, () => {
      markRangeAsDeletion(editor, range, suggestionId, rt.userId, rt.userColor)
      Transforms.select(editor, before)
    })
  }

  editor.deleteForward = (unit) => {
    const rt = getReviewRuntime()
    const selection = editor.selection
    if (!rt.enabled || !selection) {
      deleteForward(unit)
      return
    }

    if (!Range.isCollapsed(selection)) {
      const suggestionId = generateSuggestionId()
      SlateEditor.withoutNormalizing(editor, () => {
        markRangeAsDeletion(editor, selection, suggestionId, rt.userId, rt.userColor)
        Transforms.collapse(editor, { edge: 'start' })
      })
      return
    }

    const after = SlateEditor.after(editor, selection.anchor, { unit })
    if (!after) {
      deleteForward(unit)
      return
    }
    const suggestionId = generateSuggestionId()
    const range: SlateRange = { anchor: selection.anchor, focus: after }
    SlateEditor.withoutNormalizing(editor, () => {
      markRangeAsDeletion(editor, range, suggestionId, rt.userId, rt.userColor)
      Transforms.select(editor, selection.anchor)
    })
  }

  return editor
}
