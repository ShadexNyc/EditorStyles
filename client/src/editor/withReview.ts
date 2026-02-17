import type { MutableRefObject } from 'react'
import type { Editor, Point, Range as SlateRange } from 'slate'
import { Editor as SlateEditor, Element, Path, Range, Transforms } from 'slate'
import { Text } from 'slate'
import type { Descendant } from 'slate'
import type { FormattedText } from '../types/slate'
import type { ReviewPluginRef } from '../services/review/ReviewContext'

function generateSuggestionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getSuggestionAuthorMeta(pluginRef: ReviewPluginRef | null): Pick<FormattedText, 'authorId' | 'authorColor'> {
  const userId = pluginRef?.getCurrentUserId()
  const userColor = userId ? pluginRef?.getUserColor(userId) : undefined
  return {
    authorId: userId,
    authorColor: userColor,
  }
}

function isPointWithinDeletion(editor: Editor, point: Point): boolean {
  try {
    const [node] = SlateEditor.node(editor, point)
    if (!Text.isText(node)) return false
    const t = node as FormattedText
    return !!(t.suggestionDeletion || t.reviewDelete)
  } catch {
    return false
  }
}

/**
 * Курсор внутри текста вставки одной рецензии — обычный ввод продолжает текущую вставку.
 * Важно: только для collapsed selection. Любое выделение должно создавать новую рецензию.
 */
function isCaretWithinInsertion(editor: Editor): boolean {
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

function isCaretWithinDeletion(editor: Editor): boolean {
  const selection = editor.selection
  if (!selection || !Range.isCollapsed(selection)) return false
  return isPointWithinDeletion(editor, selection.anchor)
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

function markDeletionRange(editor: Editor, range: SlateRange, pluginRef: ReviewPluginRef | null): void {
  const { authorId, authorColor } = getSuggestionAuthorMeta(pluginRef)
  const suggestionId = generateSuggestionId()
  Transforms.setNodes(
    editor,
    {
      suggestionDeletion: true,
      suggestionDeletionKind: 'plain-delete',
      suggestionId,
      authorId,
      authorColor,
    } as Record<string, unknown>,
    {
      at: range,
      match: (n) => Text.isText(n),
      split: true,
    }
  )
}

export function withReview<T extends Editor>(
  editor: T,
  pluginRef: MutableRefObject<ReviewPluginRef | null>
): T {
  const { insertText, deleteBackward, deleteForward, deleteFragment } = editor

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
    // Курсор внутри вставки существующей рецензии — продолжаем её без создания новой
    if (isCaretWithinInsertion(editor)) {
      insertText(text)
      return
    }
    // Внутри удалённой рецензии ввод текста запрещён.
    if (isCaretWithinDeletion(editor)) {
      return
    }
    // Свёрнутый выбор (курсор) — новая вставка в режиме рецензирования.
    if (Range.isCollapsed(selection)) {
      const { authorId, authorColor } = getSuggestionAuthorMeta(ref)
      const insertNode: FormattedText = {
        ...(SlateEditor.marks(editor) ?? {}),
        text,
        suggestionInsertion: true,
        suggestionId: generateSuggestionId(),
        authorId,
        authorColor,
      }
      Transforms.insertNodes(editor, insertNode as { text: string; [k: string]: unknown })
      return
    }
    // Несвёрнутое выделение: создаём новую правку. Чтобы правки не перемешивались:
    // — если выделение целиком внутри зачёркнутого одной правки: удаляем выделенный фрагмент,
    //   вставляем новую правку (вставка + зачёркнутое) после конца той правки в том же блоке;
    // — иначе: вставка сразу перед зачёркиванием (at = start selection).
    const { authorId, authorColor } = getSuggestionAuthorMeta(ref)
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
            authorId,
            authorColor,
          } as FormattedText
        })
        Transforms.delete(editor, { at: selection })
        const after = getPointAfterLastNodeOfSuggestionInBlock(editor, parentDeletionId, blockPath)
        const insertAt = after ?? { path: blockPath.concat(0), offset: 0 }
        const insertNode: FormattedText = {
          text,
          suggestionInsertion: true,
          suggestionId,
          authorId,
          authorColor,
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
            authorId,
            authorColor,
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
            authorId,
            authorColor,
          }
          Transforms.insertNodes(editor, insertNode as { text: string; [k: string]: unknown }, { at })
          Transforms.select(editor, { path: at.path, offset: at.offset + text.length })
        }
      }
    })
  }

  editor.deleteFragment = (options) => {
    const ref = pluginRef.current
    const selection = editor.selection
    if (!ref || !ref.getReviewMode() || !selection || Range.isCollapsed(selection)) {
      deleteFragment(options)
      return
    }
    // Внутри удалённой рецензии изменение не допускаем.
    if (isPointWithinDeletion(editor, selection.anchor) || isPointWithinDeletion(editor, selection.focus)) {
      return
    }
    markDeletionRange(editor, selection, ref)
    const collapsePoint = Range.start(selection)
    Transforms.select(editor, collapsePoint)
  }

  editor.deleteBackward = (unit) => {
    const ref = pluginRef.current
    const selection = editor.selection
    if (!ref || !ref.getReviewMode() || !selection) {
      deleteBackward(unit)
      return
    }

    if (!Range.isCollapsed(selection)) {
      editor.deleteFragment()
      return
    }

    if (isCaretWithinDeletion(editor)) return
    if (isCaretWithinInsertion(editor)) {
      deleteBackward(unit)
      return
    }

    const before = SlateEditor.before(editor, selection.anchor, { unit })
    if (!before) return
    if (isPointWithinDeletion(editor, before)) return

    markDeletionRange(editor, { anchor: before, focus: selection.anchor }, ref)
    Transforms.select(editor, before)
  }

  editor.deleteForward = (unit) => {
    const ref = pluginRef.current
    const selection = editor.selection
    if (!ref || !ref.getReviewMode() || !selection) {
      deleteForward(unit)
      return
    }

    if (!Range.isCollapsed(selection)) {
      editor.deleteFragment()
      return
    }

    if (isCaretWithinDeletion(editor)) return
    if (isCaretWithinInsertion(editor)) {
      deleteForward(unit)
      return
    }

    const after = SlateEditor.after(editor, selection.anchor, { unit })
    if (!after) return
    if (isPointWithinDeletion(editor, after)) return

    markDeletionRange(editor, { anchor: selection.anchor, focus: after }, ref)
    Transforms.select(editor, selection.anchor)
  }

  return editor
}
