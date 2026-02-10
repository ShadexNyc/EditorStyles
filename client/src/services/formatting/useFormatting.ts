import { Editor as SlateEditor } from 'slate'

export function useFormatting(editor: SlateEditor | null) {
  const marks = editor ? (SlateEditor.marks(editor) as { bold?: boolean; italic?: boolean; underline?: boolean } | null) : null
  const isBold = marks?.bold === true
  const isItalic = marks?.italic === true
  const isUnderline = marks?.underline === true

  const toggleBold = () => {
    if (!editor) return
    if (isBold) SlateEditor.removeMark(editor, 'bold')
    else SlateEditor.addMark(editor, 'bold', true)
  }

  const toggleItalic = () => {
    if (!editor) return
    if (isItalic) SlateEditor.removeMark(editor, 'italic')
    else SlateEditor.addMark(editor, 'italic', true)
  }

  const toggleUnderline = () => {
    if (!editor) return
    if (isUnderline) SlateEditor.removeMark(editor, 'underline')
    else SlateEditor.addMark(editor, 'underline', true)
  }

  return {
    toggleBold,
    toggleItalic,
    toggleUnderline,
    isBold,
    isItalic,
    isUnderline,
  }
}
