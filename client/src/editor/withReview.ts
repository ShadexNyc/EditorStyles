import type { MutableRefObject } from 'react'
import type { Editor } from 'slate'
import { Editor as SlateEditor, Element, Path, Range, Transforms } from 'slate'
import { Text } from 'slate'
import type { Descendant } from 'slate'
import type { FormattedText } from '../types/slate'
import type { ReviewPluginRef } from '../services/review/ReviewContext'

function generateSuggestionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Выбор целиком внутри текста вставки одной рецензии — тогда только дополняем её, не создаём новую. */
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

/** Выбор целиком внутри зачёркнутого текста одной рецензии — возвращаем её suggestionId, чтобы вставить новую правку после неё. */
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

/** Собирает все текстовые узлы из фрагмента (рекурсивно). */
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

/** Точка сразу после последнего узла с данным suggestionId в заданном блоке. */
function getPointAfterLastNodeOfSuggestionInBlock(
  editor: Editor,
  suggestionId: string,
  blockPath: Path
): { path: Path; offset: number } | null {
  const entries: Array<{ path: Path }> = []
  for (const [node, path] of SlateEditor.nodes(editor, {
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

export function withReview<T extends Editor>(
  editor: T,
  pluginRef: MutableRefObject<ReviewPluginRef | null>
): T {
  const { insertText } = editor

  editor.insertText = (text: string) => {
    const ref = pluginRef.current
    if (!ref) {
      insertText(text)
      return
    }
    const reviewMode = ref.getReviewMode()
    const selection = editor.selection
    if (!reviewMode || !selection) {
      insertText(text)
      return
    }
    // Выбор целиком во вставке одной рецензии — только дополняем, новую не создаём
    if (isSelectionEntirelyWithinInsertion(editor)) {
      insertText(text)
      return
    }
    // Свёрнутый выбор (курсор) — обычный ввод
    if (Range.isCollapsed(selection)) {
      insertText(text)
      return
    }
    // Несвёрнутое выделение: создаём новую правку. Чтобы правки не перемешивались:
    // — если выделение целиком внутри зачёркнутого одной правки: удаляем выделенный фрагмент,
    //   вставляем новую правку (вставка + зачёркнутое) после конца той правки в том же блоке;
    // — иначе: вставка сразу перед зачёркиванием (at = start selection).
    const userId = ref.getCurrentUserId()
    const userColor = userId ? ref.getUserColor(userId) : undefined
    const suggestionId = generateSuggestionId()
    const parentDeletionId = getSelectionEntirelyWithinDeletionSuggestionId(editor)

    SlateEditor.withoutNormalizing(editor, () => {
      if (parentDeletionId != null) {
        // Выделение внутри зачёркнутого одной правки: новая правка ставится после неё, без смешивания.
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
          suggestionId,
          authorId: userId,
          authorColor: userColor,
        }
        Transforms.insertNodes(editor, [insertNode, ...deletionNodes] as { text: string; [k: string]: unknown }[], {
          at: insertAt,
        })
        Transforms.select(editor, { path: insertAt.path, offset: insertAt.offset + text.length })
      } else {
        const start = Range.start(selection)
        const startRef = SlateEditor.pointRef(editor, start)
        Transforms.setNodes(
          editor,
          {
            suggestionDeletion: true,
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
            suggestionId,
            authorId: userId,
            authorColor: userColor,
          }
          Transforms.insertNodes(editor, insertNode as { text: string; [k: string]: unknown }, { at })
          Transforms.select(editor, { path: at.path, offset: at.offset + text.length })
        }
      }
    })
  }

  return editor
}
