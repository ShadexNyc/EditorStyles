import { FormattingButtons } from '../services/formatting/FormattingButtons'
import { HeadingsDropdown } from '../services/headings/HeadingsDropdown'
import { FontSizeDropdown } from '../services/fontSize/FontSizeDropdown'
import { TextColorPicker } from '../services/color/TextColorPicker'
import { HighlightPicker } from '../services/highlight/HighlightPicker'
import { useReview } from '../services/review/ReviewContext'
import { ReviewStyleSelect } from '../services/review/ReviewStyleSelect'
import { ReviewToggle } from '../services/review/ReviewToggle'

export function Ribbon() {
  const { reviewMode } = useReview()

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
        {reviewMode && <ReviewStyleSelect />}
        <ReviewToggle />
      </div>
    </div>
  )
}
