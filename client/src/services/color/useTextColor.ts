import { Editor } from 'slate'

const DEFAULT_COLOR = '#333333'

export function useTextColor(editor: Editor | null) {
  const setColor = (color: string) => {
    if (!editor) return
    Editor.addMark(editor, 'color', color)
  }

  const currentColor = editor
    ? ((Editor.marks(editor) as { color?: string } | null)?.color) ?? DEFAULT_COLOR
    : DEFAULT_COLOR

  return { setColor, currentColor }
}
