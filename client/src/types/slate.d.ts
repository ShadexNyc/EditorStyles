import type { BaseElement, BaseText, Descendant } from 'slate'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface ParagraphElement extends BaseElement {
  type: 'paragraph'
  children: Descendant[]
}

export interface HeadingElement extends BaseElement {
  type: HeadingLevel
  children: Descendant[]
}

export type BlockElement = ParagraphElement | HeadingElement

export interface FormattedText extends BaseText {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: string
  color?: string
  highlight?: string
  suggestionDeletion?: boolean
  suggestionInsertion?: boolean
  suggestionId?: string
  suggestionMode?: 'replace' | 'delete' | 'insert'
  authorId?: string
  authorColor?: string
  reviewInsert?: boolean
  reviewDelete?: boolean
  acceptFlash?: boolean
}

declare module 'slate' {
  interface CustomTypes {
    Element: BlockElement
    Text: FormattedText
  }
}
