import { Editor } from 'slate'

const DEFAULT_SIZE = '11pt'
const SIZES = ['9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt']

export function useFontSize(editor: Editor | null) {
  const setSize = (size: string) => {
    if (!editor) return
    Editor.addMark(editor, 'fontSize', size)
  }

  const currentSize = editor
    ? ((Editor.marks(editor) as { fontSize?: string } | null)?.fontSize) ?? DEFAULT_SIZE
    : DEFAULT_SIZE

  return { setSize, currentSize, sizes: SIZES }
}
