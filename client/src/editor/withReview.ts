import type { MutableRefObject } from 'react'
import type { Editor } from 'slate'
import { Editor as SlateEditor, Element, Path, Range, Transforms } from 'slate'
import { Text } from 'slate'
import type { Descendant } from 'slate'
import type { FormattedText } from '../types/slate'
import type { ReviewEditMode, ReviewPluginRef } from '../services/review/ReviewContext'

function generateSuggestionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isSelectionEntirelyWithinInsertion(editor: Editor): boolean {
  const selection = editor.selection
  if (!selection || !Range.isCollapsed(selection)) return false
  try {
    const [node] = SlateEditor.node(editor, selection.anchor)
    if (!Text.isText(node)) return false
    const t = node as FormattedText
    return !!(t.suggestionInsertion && t.suggestionId)
  } catch {
    return false
  }
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

function buildDeletionNodes(fragment: Descendant[], suggestionId: string, userId?: string, userColor?: string): FormattedText[] {
  const textNodes = collectTextNodesFromFragment(fragment)
  return textNodes.map((node) => {
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
}

function insertInsertionSuggestionAtSelection(editor: Editor, text: string, userId?: string, userColor?: string) {
  const selection = editor.selection
  if (!selection) return false
  const suggestionId = generateSuggestionId()
  const start = Range.start(selection)
  const startRef = SlateEditor.pointRef(editor, start)
  const insertNode: FormattedText = {
    text,
    suggestionInsertion: true,
    suggestionMode: 'insert',
    suggestionId,
    authorId: userId,
    authorColor: userColor,
  }
  Transforms.insertNodes(editor, insertNode as { text: string; [k: string]: unknown }, { at: start })
  const at = startRef.unref()
  if (at) {
    Transforms.select(editor, { path: at.path, offset: at.offset + text.length })
  }
  return true
}

function markSelectionAsDeletion(editor: Editor, userId?: string, userColor?: string): boolean {
  const selection = editor.selection
  if (!selection || Range.isCollapsed(selection)) return false
  const suggestionId = generateSuggestionId()
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
      at: selection,
      match: (n) => Text.isText(n),
      split: true,
    }
  )
  return true
}

function createReplacementSuggestion(editor: Editor, text: string, userId?: string, userColor?: string): boolean {
  const selection = editor.selection
  if (!selection || Range.isCollapsed(selection)) return false
  const suggestionId = generateSuggestionId()
  const parentDeletionId = getSelectionEntirelyWithinDeletionSuggestionId(editor)

  if (parentDeletionId != null) {
    const blockPath = selection.anchor.path.slice(0, -1)
    const fragment = SlateEditor.fragment(editor, selection)
    const deletionNodes = buildDeletionNodes(fragment, suggestionId, userId, userColor).map((n) => ({ ...n, suggestionMode: 'replace' as const }))
    Transforms.delete(editor, { at: selection })
    const after = getPointAfterLastNodeOfSuggestionInBlock(editor, parentDeletionId, blockPath)
    const insertAt = after ?? { path: blockPath.concat(0), offset: 0 }
    const insertNode: FormattedText = {
      text,
      suggestionInsertion: true,
      suggestionMode: 'replace',
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
  Transforms.setNodes(
    editor,
    {
      suggestionDeletion: true,
      suggestionMode: 'replace',
      suggestionId,
      authorId: userId,
      authorColor: userColor,
    } as Record<string, unknown>,
    {
      at: selection,
      match: (n) => Text.isText(n),
      split: true,
    }
  )
  const at = startRef.unref()
  if (at) {
    const insertNode = {
      text,
      suggestionInsertion: true,
      suggestionMode: 'replace',
      suggestionId,
      authorId: userId,
      authorColor: userColor,
    }
    Transforms.insertNodes(editor, insertNode as { text: string; [k: string]: unknown }, { at })
    Transforms.select(editor, { path: at.path, offset: at.offset + text.length })
  }
  return true
}

export function withReview<T extends Editor>(
  editor: T,
  pluginRef: MutableRefObject<ReviewPluginRef | null>
): T {
  const { insertText, deleteFragment, deleteBackward, deleteForward } = editor

  const getReviewRuntime = (): { enabled: boolean; mode: ReviewEditMode; userId?: string; userColor?: string } => {
    const ref = pluginRef.current
    if (!ref || !ref.getReviewMode()) {
      return { enabled: false, mode: 'replace' }
    }
    const userId = ref.getCurrentUserId()
    return {
      enabled: true,
      mode: ref.getReviewEditMode(),
      userId,
      userColor: userId ? ref.getUserColor(userId) : undefined,
    }
  }

  editor.insertText = (text: string) => {
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

    if (rt.mode === 'insert') {
      SlateEditor.withoutNormalizing(editor, () => {
        insertInsertionSuggestionAtSelection(editor, text, rt.userId, rt.userColor)
      })
      return
    }

    if (rt.mode === 'delete') {
      if (!Range.isCollapsed(selection)) {
        SlateEditor.withoutNormalizing(editor, () => {
          markSelectionAsDeletion(editor, rt.userId, rt.userColor)
        })
        return
      }
      insertText(text)
      return
    }

    if (Range.isCollapsed(selection)) {
      insertText(text)
      return
    }

    SlateEditor.withoutNormalizing(editor, () => {
      createReplacementSuggestion(editor, text, rt.userId, rt.userColor)
    })
  }

  editor.deleteFragment = (...args) => {
    const rt = getReviewRuntime()
    const selection = editor.selection
    if (rt.enabled && rt.mode === 'delete' && selection && !Range.isCollapsed(selection)) {
      SlateEditor.withoutNormalizing(editor, () => {
        markSelectionAsDeletion(editor, rt.userId, rt.userColor)
      })
      return
    }
    deleteFragment(...args)
  }

  editor.deleteBackward = (unit) => {
    const rt = getReviewRuntime()
    const selection = editor.selection
    if (rt.enabled && rt.mode === 'delete' && selection && !Range.isCollapsed(selection)) {
      SlateEditor.withoutNormalizing(editor, () => {
        markSelectionAsDeletion(editor, rt.userId, rt.userColor)
      })
      return
    }
    deleteBackward(unit)
  }

  editor.deleteForward = (unit) => {
    const rt = getReviewRuntime()
    const selection = editor.selection
    if (rt.enabled && rt.mode === 'delete' && selection && !Range.isCollapsed(selection)) {
      SlateEditor.withoutNormalizing(editor, () => {
        markSelectionAsDeletion(editor, rt.userId, rt.userColor)
      })
      return
    }
    deleteForward(unit)
  }

  return editor
}
