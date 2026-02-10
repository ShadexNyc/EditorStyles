import type { MutableRefObject } from 'react'
import type { Editor } from 'slate'
import { Editor as SlateEditor, Range, Transforms } from 'slate'
import { Text } from 'slate'
import type { ReviewPluginRef } from '../services/review/ReviewContext'

function generateSuggestionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
    if (!reviewMode || !selection || Range.isCollapsed(selection)) {
      insertText(text)
      return
    }
    // Выделение внутри уже созданной рецензии и ввод текста создаёт новую рецензию
    // (setNodes с split: true разбивает узлы — выделенная часть получает новый suggestionId)
    const userId = ref.getCurrentUserId()
    const userColor = userId ? ref.getUserColor(userId) : undefined
    const suggestionId = generateSuggestionId()

    SlateEditor.withoutNormalizing(editor, () => {
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
    })
  }

  return editor
}
