import { Editor, Element, Transforms } from 'slate'
import type { HeadingLevel } from '../../types/slate'

const BLOCK_TYPES: (HeadingLevel | 'paragraph')[] = ['paragraph', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

export function useHeadings(editor: Editor | null) {
  const setBlockType = (type: HeadingLevel | 'paragraph') => {
    if (!editor) return
    Transforms.setNodes(
      editor,
      { type: type === 'paragraph' ? 'paragraph' : type },
      { match: (n) => Element.isElement(n) && Editor.isBlock(editor, n) }
    )
  }

  const getBlockType = (): HeadingLevel | 'paragraph' => {
    if (!editor) return 'paragraph'
    const [match] = Editor.nodes(editor, {
      match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
    })
    if (!match) return 'paragraph'
    const node = match[0] as { type?: string }
    const t = node.type
    return BLOCK_TYPES.includes(t as HeadingLevel | 'paragraph') ? (t as HeadingLevel | 'paragraph') : 'paragraph'
  }

  return { setBlockType, getBlockType, blockTypes: BLOCK_TYPES }
}
