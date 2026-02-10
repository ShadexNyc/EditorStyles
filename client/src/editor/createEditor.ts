import type { MutableRefObject } from 'react'
import { createEditor } from 'slate'
import { withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import { withReview } from './withReview'
import type { ReviewPluginRef } from '../services/review/ReviewContext'

export function createSlateEditor(pluginRef: MutableRefObject<ReviewPluginRef | null>) {
  return withReview(withHistory(withReact(createEditor())), pluginRef)
}
