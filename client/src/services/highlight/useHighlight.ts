import { Editor } from 'slate'

const DEFAULT_HIGHLIGHT = 'rgba(155, 207, 255, 0.5)'

export function useHighlight(editor: Editor | null) {
  const setHighlight = (color: string) => {
    if (!editor) return
    Editor.addMark(editor, 'highlight', color)
  }

  const currentHighlight = editor
    ? ((Editor.marks(editor) as { highlight?: string } | null)?.highlight) ?? DEFAULT_HIGHLIGHT
    : DEFAULT_HIGHLIGHT

  return { setHighlight, currentHighlight }
}
