import { FormattingButtons } from '../services/formatting/FormattingButtons'
import { HeadingsDropdown } from '../services/headings/HeadingsDropdown'
import { FontSizeDropdown } from '../services/fontSize/FontSizeDropdown'
import { TextColorPicker } from '../services/color/TextColorPicker'
import { HighlightPicker } from '../services/highlight/HighlightPicker'
import { ReviewToggle } from '../services/review/ReviewToggle'

export function Ribbon() {
  return (
    <div className="ribbon" role="toolbar" aria-label="Форматирование">
      <div className="ribbon-group">
        <HeadingsDropdown />
        <FormattingButtons />
      </div>
      <div className="ribbon-group">
        <FontSizeDropdown />
      </div>
      <div className="ribbon-group">
        <TextColorPicker />
      </div>
      <div className="ribbon-group">
        <HighlightPicker />
      </div>
      <div className="ribbon-group" style={{ marginLeft: 'auto' }}>
        <ReviewToggle />
      </div>
    </div>
  )
}
