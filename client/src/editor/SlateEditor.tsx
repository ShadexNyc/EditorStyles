import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Editor, Descendant, Element as SlateElement, Node, Text as SlateText } from 'slate'
import { Editable, useSlate } from 'slate-react'
import type { RenderElementProps, RenderLeafProps } from 'slate-react'
import type { FormattedText } from '../types/slate'
import { useReview } from '../services/review/ReviewContext'
import { ReviewCommentsContext } from '../services/review/ReviewCommentsContext'
import { acceptSuggestion, rejectSuggestion } from './commitReview'

function Element({ attributes, children, element }: RenderElementProps) {
  const style: React.CSSProperties = {}
  if (element.type === 'paragraph') {
    style.marginBottom = '0.75em'
  }
  if (element.type === 'h1') {
    style.fontSize = '24pt'
    style.fontWeight = 700
    style.marginTop = '0.5em'
    style.marginBottom = '0.25em'
  }
  if (element.type === 'h2') {
    style.fontSize = '18pt'
    style.fontWeight = 600
    style.marginTop = '0.5em'
    style.marginBottom = '0.25em'
  }
  if (element.type === 'h3') {
    style.fontSize = '14pt'
    style.fontWeight = 600
    style.marginTop = '0.4em'
    style.marginBottom = '0.2em'
  }
  if (element.type === 'h4' || element.type === 'h5' || element.type === 'h6') {
    style.fontSize = '12pt'
    style.fontWeight = 600
    style.marginTop = '0.3em'
    style.marginBottom = '0.2em'
  }
  const tagName = element.type === 'paragraph' ? 'p' : element.type
  const Tag = tagName as 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  return (
    <Tag style={style} {...attributes}>
      {children}
    </Tag>
  )
}

function authorColorToRgba(hsl: string | undefined, alpha: number): string | undefined {
  if (!hsl || !hsl.startsWith('hsl')) return undefined
  const m = hsl.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/)
  if (!m) return undefined
  const h = Number(m[1]) / 360
  const s = Number(m[2]) / 100
  const l = Number(m[3]) / 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`
}
function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function Leaf({
  attributes,
  children,
  leaf,
  editingSuggestionId,
  sidebarEditingSuggestionId,
  acceptHighlightSuggestionId,
  reviewStyleId,
  acceptHover,
}: RenderLeafProps & {
  editingSuggestionId: string | null
  sidebarEditingSuggestionId: string | null
  acceptHighlightSuggestionId: string | null
  reviewStyleId: string
  acceptHover: boolean
}) {
  const text = leaf as FormattedText
  const style: React.CSSProperties = {}
  const isDeletionLeaf = text.suggestionDeletion || text.reviewDelete
  /* Вне редактирования рецензии (кнопка «Принять» в комментариях): подсвечивать зелёным только предложенный текст (вставку), зачёркнутый не подсвечиваем */
  const isAcceptHighlight =
    acceptHover &&
    acceptHighlightSuggestionId != null &&
    text.suggestionId === acceptHighlightSuggestionId
  const isInsertionAcceptHighlight = isAcceptHighlight && !isDeletionLeaf
  if (isInsertionAcceptHighlight) {
    style.backgroundColor = 'rgba(34, 197, 94, 0.25)'
  }
  if (text.bold) style.fontWeight = 'bold'
  if (text.italic) style.fontStyle = 'italic'
  if (text.underline) style.textDecoration = 'underline'
  if (text.fontSize) style.fontSize = text.fontSize
  if (text.color) style.color = text.color
  if (text.highlight) {
    style.backgroundColor = text.highlight
    style.mixBlendMode = 'multiply'
  }
  const isEditingThisSuggestion =
    text.suggestionId != null &&
    (text.suggestionId === editingSuggestionId || text.suggestionId === sidebarEditingSuggestionId)
  const isDeletion = isDeletionLeaf
  const isInsertionNode = text.suggestionInsertion || text.reviewInsert
  const showInsertionStyle = isInsertionNode && !isEditingThisSuggestion
  const isStyle5Or6 = reviewStyleId === 'style-5' || reviewStyleId === 'style-6'
  if (isStyle5Or6) {
    /* Стиль 5/6: зачёркнутый текст (deletion) всегда с красным фоном; вставка — цвет пользователя */
    if ((isDeletion || isInsertionNode) && text.authorColor) {
      style.display = 'inline'
      style.marginRight = '2px'
      if (!isEditingThisSuggestion) {
        style.color = isDeletion ? 'var(--review-strikethrough-color)' : text.authorColor
        style.textDecoration = style.textDecoration ? `${style.textDecoration} underline` : 'underline'
      } else {
        /* В режиме редактирования красные буквы только у зачёркнутого текста (удаление) */
        if (reviewStyleId === 'style-6') {
          if (isDeletion) style.color = 'var(--review-strikethrough-color)'
        } else {
          if (isDeletion) {
            style.color = 'var(--review-strikethrough-color)'
          } else if (!isInsertionAcceptHighlight) {
            style.backgroundColor = authorColorToRgba(text.authorColor, 0.2) ?? text.authorColor
          }
        }
      }
    }
    if (isDeletion) {
      style.textDecoration = (style.textDecoration || '') ? `${style.textDecoration} line-through` : 'line-through'
      style.textDecorationColor = 'var(--review-strikethrough-color)'
      style.textDecorationThickness = '2px'
      /* Стиль 5: красный фон только при редактировании; стиль 6: всегда красный фон */
      if (reviewStyleId === 'style-6' || (reviewStyleId === 'style-5' && isEditingThisSuggestion)) {
        style.backgroundColor = 'rgba(255, 0, 0, 0.1)'
      }
    }
  } else {
    if (isDeletion) {
      style.display = 'inline'
      style.marginRight = '2px'
      style.textDecoration = 'line-through'
      style.textDecorationColor = 'var(--review-strikethrough-color)'
      style.textDecorationThickness = 'var(--review-strikethrough-thickness, 2px)'
      if (!isEditingThisSuggestion) style.backgroundColor = 'rgba(255, 0, 0, 0.08)'
    }
    if (isInsertionNode) {
      style.display = 'inline'
      style.marginRight = '2px'
      style.borderLeft = `3px solid ${showInsertionStyle && text.authorColor && !isInsertionAcceptHighlight ? text.authorColor : 'transparent'}`
    }
    if (showInsertionStyle && text.authorColor && !isInsertionAcceptHighlight) {
      style.backgroundColor = authorColorToRgba(text.authorColor, 0.3) ?? text.authorColor
      style.textDecoration = style.textDecoration ? `${style.textDecoration} underline` : 'underline'
    } else if (showInsertionStyle) {
      style.textDecoration = style.textDecoration ? `${style.textDecoration} underline` : 'underline'
    }
  }
  const dataProps: Record<string, string> = {}
  if (text.suggestionId != null) {
    dataProps['data-suggestion-id'] = text.suggestionId
    dataProps['data-author-color'] = text.authorColor ?? ''
    if (isDeletion) dataProps['data-review-type'] = 'deletion'
    else if (isInsertionNode) dataProps['data-review-type'] = 'insertion'
  }
  if (isInsertionAcceptHighlight) {
    dataProps['data-accept-highlight'] = 'true'
  }
  const reviewClasses = [
    isDeletion && 'review-deletion',
    isDeletion && isEditingThisSuggestion && 'review-deletion-editing',
    (isInsertionNode || showInsertionStyle) && 'review-insertion',
    text.acceptFlash && 'review-accept-flash',
    isInsertionAcceptHighlight && 'review-accept-highlight',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <span
      {...attributes}
      {...dataProps}
      style={style}
      className={[isDeletion ? 'review-strikethrough' : undefined, reviewClasses].filter(Boolean).join(' ') || undefined}
    >
      {children}
    </span>
  )
}

function useEditingSuggestionId(): string | null {
  const editor = useSlate()
  return useMemo(() => {
    const sel = editor.selection
    if (!sel) return null
    try {
      const [node] = Editor.node(editor, sel.anchor)
      if (SlateText.isText(node) && (node as FormattedText).suggestionId) {
        return (node as FormattedText).suggestionId ?? null
      }
    } catch {
      // selection may point to invalid path
    }
    return null
  }, [editor, editor.selection])
}

type LineRect = { top: number; left: number; width: number; height: number; color: string; rightBorder?: boolean }

type ToolbarRect = { top: number; left: number; width: number }

type ClusteredLine = {
  lineTop: number
  lineBottom: number
  minLeft: number
  maxRight: number
}

function isValidRect(rect: DOMRect): boolean {
  return Number.isFinite(rect.top) && Number.isFinite(rect.bottom) && rect.width > 0 && rect.height > 0
}

function clusterRectsByVerticalOverlap(rects: DOMRect[], tolerance = 2): ClusteredLine[] {
  const lines: ClusteredLine[] = []
  const sortedRects = rects
    .filter(isValidRect)
    .slice()
    .sort((a, b) => a.top - b.top)

  sortedRects.forEach((rect) => {
    const existingLine = lines.find(
      (line) => rect.top <= line.lineBottom + tolerance && rect.bottom >= line.lineTop - tolerance
    )
    if (existingLine) {
      existingLine.lineTop = Math.min(existingLine.lineTop, rect.top)
      existingLine.lineBottom = Math.max(existingLine.lineBottom, rect.bottom)
      existingLine.minLeft = Math.min(existingLine.minLeft, rect.left)
      existingLine.maxRight = Math.max(existingLine.maxRight, rect.right)
      return
    }

    lines.push({
      lineTop: rect.top,
      lineBottom: rect.bottom,
      minLeft: rect.left,
      maxRight: rect.right,
    })
  })

  return lines.sort((a, b) => a.lineTop - b.lineTop)
}

function ReviewEditingOverlay({
  editingSuggestionId,
  showToolbar,
  containerRef,
  reviewStyleId,
  onAcceptHoverChange,
  onToolbarHoverChange,
  onAccept,
  onReject,
}: {
  editingSuggestionId: string | null
  showToolbar: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  reviewStyleId: string
  onAcceptHoverChange: (v: boolean) => void
  onToolbarHoverChange?: (hovered: boolean) => void
  onAccept: () => void
  onReject: () => void
}) {
  const [lineRects, setLineRects] = useState<LineRect[]>([])
  const [style1TopBottom, setStyle1TopBottom] = useState<LineRect[] | null>(null)
  const [toolbarRect, setToolbarRect] = useState<ToolbarRect | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState<'accept' | 'reject' | null>(null)
  const useVerticalLines = reviewStyleId === 'style-2'

  const measure = useCallback(() => {
    if (!editingSuggestionId || !containerRef.current) {
      setLineRects([])
      setStyle1TopBottom(null)
      setToolbarRect(null)
      return
    }
    const container = containerRef.current
    const nodes = container.querySelectorAll(`[data-suggestion-id="${editingSuggestionId}"]`)
    if (nodes.length === 0) {
      setLineRects([])
      setStyle1TopBottom(null)
      return
    }
    const authorColor = (nodes[0] as HTMLElement).getAttribute('data-author-color') || '#666'
    const containerRect = container.getBoundingClientRect()
    const containerWidth = container.clientWidth
    const containerHeight = container.scrollHeight
    const nodeRects = Array.from(nodes).flatMap((el) => Array.from((el as HTMLElement).getClientRects())).filter(isValidRect)
    if (nodeRects.length === 0) {
      setLineRects([])
      setStyle1TopBottom(null)
      setToolbarRect(null)
      return
    }
    /* Тулбар плавает у конца нижней линии — где заканчивается зачёркнутая строка рецензии */
    const deletionNodes = container.querySelectorAll(
      `[data-suggestion-id="${editingSuggestionId}"][data-review-type="deletion"]`
    )
    let endBottomLineBottom: number
    const deletionRects = Array.from(deletionNodes)
      .flatMap((el) => Array.from((el as HTMLElement).getClientRects()))
      .filter(isValidRect)
    const deletionLines = clusterRectsByVerticalOverlap(deletionRects, 2)
    if (deletionLines.length > 0) {
      endBottomLineBottom = Math.max(...deletionLines.map((line) => line.lineBottom))
    } else {
      endBottomLineBottom = Math.max(...nodeRects.map((r) => r.bottom))
    }
    const toolbarWidth = 80
    const gap = 8
    const reviewMinLeft = Math.min(...nodeRects.map((r) => r.left))
    const reviewMaxRight = Math.max(...nodeRects.map((r) => r.right))
    const reviewCenterX = (reviewMinLeft + reviewMaxRight) / 2 - containerRect.left
    const leftCentered = reviewCenterX - toolbarWidth / 2
    setToolbarRect({
      top: endBottomLineBottom - containerRect.top + 6,
      left: Math.max(0, Math.min(leftCentered, containerWidth - toolbarWidth - gap)),
      width: toolbarWidth,
    })

    if (useVerticalLines) {
      const allNodes = container.querySelectorAll(`[data-suggestion-id="${editingSuggestionId}"]`)
      const deletionNodes = container.querySelectorAll(
        `[data-suggestion-id="${editingSuggestionId}"][data-review-type="deletion"]`
      )
      const allRects = Array.from(allNodes)
        .flatMap((el) => Array.from((el as HTMLElement).getClientRects()))
        .filter(isValidRect)
      const deletionRects = Array.from(deletionNodes)
        .flatMap((el) => Array.from((el as HTMLElement).getClientRects()))
        .filter(isValidRect)
      const allLines = clusterRectsByVerticalOverlap(allRects, 2)
      const deletionLines = clusterRectsByVerticalOverlap(deletionRects, 2)
      const rects: LineRect[] = []
      allLines.forEach((line) => {
        const deletionRight = deletionLines
          .filter(
            (deletionLine) => deletionLine.lineTop <= line.lineBottom + 2 && deletionLine.lineBottom >= line.lineTop - 2
          )
          .reduce<number | null>((maxRight, deletionLine) => {
            if (maxRight == null) return deletionLine.maxRight
            return Math.max(maxRight, deletionLine.maxRight)
          }, null)
        const rightEdge = deletionRight ?? line.maxRight
        let top = line.lineTop - containerRect.top
        let left = line.minLeft - containerRect.left
        let width = rightEdge - line.minLeft
        let height = line.lineBottom - line.lineTop
        left = Math.max(0, left)
        width = Math.min(width, Math.max(0, containerWidth - left))
        if (width < 0) width = 0
        top = Math.max(0, top)
        height = Math.min(height, containerHeight - top)
        if (height < 0) height = 0
        rects.push({
          top,
          left,
          width,
          height,
          color: authorColor,
          rightBorder: deletionRight != null,
        })
      })
      rects.sort((a, b) => a.top - b.top)
      setLineRects(rects)
      setStyle1TopBottom(null)
    } else {
      /* Стиль 5 в режиме редактирования: без линий сверху и снизу */
      if (reviewStyleId === 'style-5') {
        setStyle1TopBottom(null)
        setLineRects([])
        return
      }
      /* Стиль 1/3/4: линии строго по символам — от первого до последнего символа рецензии на каждой строке.
       * Верхняя линия: первая строка (minLeft..maxRight первой строки, включая зачёркнутый текст).
       * Нижняя линия: последняя строка (minLeft рецензии..maxRight зачёркнутого на последней строке).
       * Учитываются переносы: одна линия сверху над первой строкой, одна снизу под последней. */
      const byLine = clusterRectsByVerticalOverlap(nodeRects, 2)
      const lineHeight = 2
      const lineGap = 2
      const style1LineColor = 'var(--review-style1-line, #b0b0b0)'
      const lineColor = reviewStyleId === 'style-4' || reviewStyleId === 'style-5' || reviewStyleId === 'style-7' ? authorColor : style1LineColor
      if (byLine.length === 0) {
        setStyle1TopBottom(null)
        setLineRects([])
        return
      }
      const first = byLine[0]
      const firstLineTop = first.lineTop
      const firstLineBottom = first.lineBottom
      const lastLineInfo = byLine.reduce((a, b) => (a.lineBottom > b.lineBottom ? a : b))
      const lastLineTop = lastLineInfo.lineTop
      const lastLineBottom = lastLineInfo.lineBottom
      const lineOverlapTolerance = 1

      function rectsOnLine(el: Element, lineTop: number, lineBottom: number): DOMRect[] {
        const list = (el as HTMLElement).getClientRects()
        return Array.from(list).filter(
          (r) => r.top < lineBottom + lineOverlapTolerance && r.bottom > lineTop - lineOverlapTolerance
        )
      }

      let firstMinLeft = Infinity
      let firstMaxRight = -Infinity
      Array.from(nodes).forEach((el) => {
        rectsOnLine(el, firstLineTop, firstLineBottom).forEach((r) => {
          firstMinLeft = Math.min(firstMinLeft, r.left)
          firstMaxRight = Math.max(firstMaxRight, r.right)
        })
      })
      if (firstMinLeft === Infinity) {
        firstMinLeft = first.minLeft
        firstMaxRight = first.maxRight
      }

      const deletionNodes = container.querySelectorAll(
        `[data-suggestion-id="${editingSuggestionId}"][data-review-type="deletion"]`
      )
      let lastMinLeft = Infinity
      let lastMaxRightFromDeletion = -Infinity
      let lastMaxRightFromAll = -Infinity
      Array.from(nodes).forEach((el) => {
        rectsOnLine(el, lastLineTop, lastLineBottom).forEach((r) => {
          lastMinLeft = Math.min(lastMinLeft, r.left)
          lastMaxRightFromAll = Math.max(lastMaxRightFromAll, r.right)
        })
      })
      Array.from(deletionNodes).forEach((el) => {
        rectsOnLine(el, lastLineTop, lastLineBottom).forEach((r) => {
          lastMaxRightFromDeletion = Math.max(lastMaxRightFromDeletion, r.right)
        })
      })
      let lastMaxRight = lastMaxRightFromDeletion > -Infinity ? lastMaxRightFromDeletion : lastMaxRightFromAll
      if (lastMinLeft === Infinity) lastMinLeft = lastLineInfo.minLeft
      if (lastMaxRight === -Infinity) lastMaxRight = lastLineInfo.maxRight
      const topLineTop = Math.max(0, first.lineTop - containerRect.top - lineGap)
      const topLeft = Math.max(0, firstMinLeft - containerRect.left)
      const bottomLineTop = lastLineBottom - containerRect.top + lineGap
      const bottomLeft = Math.max(0, lastMinLeft - containerRect.left)
      const topW = Math.max(0, Math.min(firstMaxRight - firstMinLeft, Math.max(0, containerWidth - topLeft)))
      const bottomW = Math.max(0, Math.min(lastMaxRight - lastMinLeft, Math.max(0, containerWidth - bottomLeft)))
      if (topW <= 0 && bottomW <= 0) {
        setStyle1TopBottom(null)
      } else {
        setStyle1TopBottom([
          { top: topLineTop, left: topLeft, width: Math.max(0, topW), height: lineHeight, color: lineColor },
          { top: bottomLineTop, left: bottomLeft, width: Math.max(0, bottomW), height: lineHeight, color: lineColor },
        ])
      }
      setLineRects([])
    }
  }, [editingSuggestionId, containerRef, useVerticalLines, reviewStyleId])

  useLayoutEffect(() => {
    measure()
    if (!editingSuggestionId || !containerRef.current) return
    const container = containerRef.current
    const scrollHandler = () => measure()
    window.addEventListener('scroll', scrollHandler, true)
    const resizeRo = new ResizeObserver(scrollHandler)
    resizeRo.observe(container)
    const mutationRo = new MutationObserver(() => measure())
    mutationRo.observe(container, { childList: true, subtree: true, characterData: true, characterDataOldValue: false })
    return () => {
      window.removeEventListener('scroll', scrollHandler, true)
      resizeRo.disconnect()
      mutationRo.disconnect()
    }
  }, [editingSuggestionId, measure])

  if (useVerticalLines) {
    if (lineRects.length === 0) return null
    return (
      <>
        {lineRects.map((r, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
              borderLeft: `2px solid ${r.color}`,
              ...(r.rightBorder ? { borderRight: `2px solid ${r.color}` } : {}),
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
        ))}
      </>
    )
  }

  if (editingSuggestionId && toolbarRect && showToolbar) {
    return (
      <>
        {style1TopBottom != null && (
          <>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: style1TopBottom[0].top,
                left: style1TopBottom[0].left,
                width: style1TopBottom[0].width,
                height: style1TopBottom[0].height,
                borderTop: `2px solid ${style1TopBottom[0].color}`,
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
            {style1TopBottom.slice(1).map((line, i) => (
              <div
                key={i}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: line.top,
                  left: line.left,
                  width: line.width,
                  height: line.height,
                  borderBottom: `2px solid ${line.color}`,
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </>
        )}
        <div
          className="review-toolbar"
          role="toolbar"
          onMouseEnter={() => onToolbarHoverChange?.(true)}
          onMouseLeave={() => onToolbarHoverChange?.(false)}
          style={{
            position: 'absolute',
            top: toolbarRect.top,
            left: toolbarRect.left,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 6px',
            background: 'var(--color-bg-canvas, #fff)',
            border: '1px solid var(--color-border-canvas, #d0d0d0)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label="Принять правку"
              onMouseEnter={() => {
                onAcceptHoverChange(true)
                setTooltipVisible('accept')
              }}
              onMouseLeave={() => {
                onAcceptHoverChange(false)
                setTooltipVisible(null)
              }}
              onClick={() => {
                onAccept()
                setToolbarRect(null)
                setTooltipVisible(null)
              }}
              className="review-toolbar-btn"
              style={{
                padding: 6,
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                cursor: 'pointer',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
            {tooltipVisible === 'accept' && (
              <span className="review-toolbar-tooltip" role="tooltip">
                Принять правку
              </span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label="Отменить"
              onMouseEnter={() => setTooltipVisible('reject')}
              onMouseLeave={() => setTooltipVisible(null)}
              onClick={() => {
                onReject()
                setToolbarRect(null)
                setTooltipVisible(null)
              }}
              className="review-toolbar-btn"
              style={{
                padding: 6,
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                cursor: 'pointer',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {tooltipVisible === 'reject' && (
              <span className="review-toolbar-tooltip" role="tooltip">
                Отменить
              </span>
            )}
          </div>
        </div>
      </>
    )
  }

  if (style1TopBottom) {
    const [topLine, ...bottomLines] = style1TopBottom
    return (
      <>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: topLine.top,
            left: topLine.left,
            width: topLine.width,
            height: topLine.height,
            borderTop: `2px solid ${topLine.color}`,
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
        {bottomLines.map((line, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              top: line.top,
              left: line.left,
              width: line.width,
              height: line.height,
              borderBottom: `2px solid ${line.color}`,
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
        ))}
      </>
    )
  }

  return null
}

export function SlateEditorBody() {
  const editor = useSlate()
  const editingSuggestionId = useEditingSuggestionId()
  const { currentReviewStyleId, reviewMode } = useReview()
  const { fromSidebar, setFromSidebar, openedSuggestionId, acceptHoverSuggestionId } = useContext(
    ReviewCommentsContext
  )
  const wrapRef = useRef<HTMLDivElement>(null)
  const [acceptHover, setAcceptHover] = useState(false)
  const [isToolbarHovered, setIsToolbarHovered] = useState(false)

  const exitedSuggestionIdsRef = useRef<Set<string>>(new Set())
  const lastStickySuggestionIdRef = useRef<string | null>(null)
  const prevEditingSuggestionIdRef = useRef<string | null>(null)
  const editableWrapRef = useRef<HTMLDivElement>(null)

  const focusInEditable =
    editableWrapRef.current != null && editableWrapRef.current.contains(document.activeElement)

  if (editingSuggestionId != null) {
    lastStickySuggestionIdRef.current = editingSuggestionId
  } else if (editor.selection != null && focusInEditable && !isToolbarHovered) {
    try {
      const [node] = Editor.node(editor, editor.selection.anchor)
      if (SlateText.isText(node) && (node as FormattedText).suggestionId == null) {
        lastStickySuggestionIdRef.current = null
      }
    } catch {
      // keep lastStickySuggestionIdRef when selection is invalid or not in text
    }
  }

  const effectiveEditingSuggestionId =
    editingSuggestionId ??
    (editor.selection == null || !focusInEditable || isToolbarHovered
      ? lastStickySuggestionIdRef.current
      : null)

  const overlayEditingId =
    fromSidebar && openedSuggestionId != null
      ? openedSuggestionId
      : effectiveEditingSuggestionId ?? lastStickySuggestionIdRef.current

  const isAcceptHighlight = acceptHover || acceptHoverSuggestionId != null
  const acceptHighlightId = acceptHoverSuggestionId ?? overlayEditingId

  useEffect(() => {
    if (editingSuggestionId === null) {
      if (prevEditingSuggestionIdRef.current != null) {
        exitedSuggestionIdsRef.current.add(prevEditingSuggestionIdRef.current)
        lastStickySuggestionIdRef.current = null
      }
    }
    prevEditingSuggestionIdRef.current = editingSuggestionId
  }, [editingSuggestionId])

  useEffect(() => {
    if (overlayEditingId === null) setIsToolbarHovered(false)
  }, [overlayEditingId])

  const showToolbar =
    overlayEditingId != null &&
    exitedSuggestionIdsRef.current.has(overlayEditingId) &&
    !fromSidebar
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const sidebarEditingSuggestionId =
    fromSidebar && openedSuggestionId != null ? openedSuggestionId : null
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => (
      <Leaf
        {...props}
        editingSuggestionId={editingSuggestionId}
        sidebarEditingSuggestionId={sidebarEditingSuggestionId}
        acceptHighlightSuggestionId={acceptHighlightId}
        reviewStyleId={currentReviewStyleId}
        acceptHover={isAcceptHighlight}
      />
    ),
    [
      editingSuggestionId,
      sidebarEditingSuggestionId,
      acceptHighlightId,
      currentReviewStyleId,
      isAcceptHighlight,
    ]
  )

  const handleAccept = useCallback(() => {
    const id = effectiveEditingSuggestionId ?? editingSuggestionId
    if (id) {
      acceptSuggestion(editor, id)
      setAcceptHover(false)
      lastStickySuggestionIdRef.current = null
    }
  }, [editor, effectiveEditingSuggestionId, editingSuggestionId])

  const handleReject = useCallback(() => {
    const id = effectiveEditingSuggestionId ?? editingSuggestionId
    if (id) {
      rejectSuggestion(editor, id)
      setAcceptHover(false)
      lastStickySuggestionIdRef.current = null
    }
  }, [editor, effectiveEditingSuggestionId, editingSuggestionId])

  return (
    <div
      ref={wrapRef}
      className="slate-editor-wrap"
      style={{ position: 'relative' }}
      data-review-style={currentReviewStyleId}
    >
      <div
        ref={editableWrapRef}
        style={{ minHeight: '100%' }}
        onMouseDown={() => setFromSidebar(false)}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Введите текст..."
          spellCheck
          style={{
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-default)',
            color: 'var(--color-text)',
            minHeight: '100%',
            outline: 'none',
            caretColor: 'var(--color-cursor)',
          }}
        />
      </div>
      {reviewMode && (
        <ReviewEditingOverlay
          editingSuggestionId={overlayEditingId}
          showToolbar={showToolbar}
          containerRef={wrapRef}
          reviewStyleId={currentReviewStyleId}
          onAcceptHoverChange={setAcceptHover}
          onToolbarHoverChange={setIsToolbarHovered}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  )
}

export type { Descendant, Node, SlateElement, SlateText }
