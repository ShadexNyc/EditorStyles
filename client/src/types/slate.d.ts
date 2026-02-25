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

export interface ImageElement extends BaseElement {
  type: 'image'
  url: string
  alt: string
  width?: number
  reviewEdited?: boolean
  reviewFrameColor?: string
  reviewDeleted?: boolean
  children: Descendant[]
}

export interface TableCellElement extends BaseElement {
  type: 'table-cell'
  children: Descendant[]
}

export interface TableRowElement extends BaseElement {
  type: 'table-row'
  children: TableCellElement[]
}

export interface TableElement extends BaseElement {
  type: 'table'
  children: TableRowElement[]
}

export type BlockElement =
  | ParagraphElement
  | HeadingElement
  | ImageElement
  | TableElement
  | TableRowElement
  | TableCellElement

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
  suggestionDeletionKind?: 'plain-delete'
  suggestionId?: string
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
