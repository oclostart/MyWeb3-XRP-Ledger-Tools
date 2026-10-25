import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

/** The bubble stands 12 off what it names, so the arrow's tip lands 4 short of it. */
const GAP = 12
/** How close to the screen's edge a bubble may come. */
const MARGIN = 8
/** How near the bubble's corner the arrow may slide when the bubble is pushed in from an edge. */
const ARROW_INSET = 14

interface Placement {
  side: 'top' | 'bottom'
  top: number
  left: number
  /** The arrow's centre, from the bubble's left edge. */
  arrow: number
}

/**
 * Where the bubble goes — **the platform's rule** (owner, 2026-10-15, for the
 * directory and the tools alike): **above what it names, always, unless the
 * screen has no room above it; only then below.** Sideways it centres on the
 * control and slides back inside the screen's edge, the arrow staying on the
 * control.
 */
function place(anchor: DOMRect, bubble: DOMRect): Placement {
  const roomAbove = anchor.top - GAP - bubble.height >= MARGIN
  const roomBelow = anchor.bottom + GAP + bubble.height <= window.innerHeight - MARGIN
  const side = roomAbove || !roomBelow ? 'top' : 'bottom'
  const centre = anchor.left + anchor.width / 2
  const left = Math.min(
    Math.max(centre - bubble.width / 2, MARGIN),
    Math.max(MARGIN, window.innerWidth - MARGIN - bubble.width),
  )
  return {
    side,
    top: side === 'top' ? anchor.top - GAP - bubble.height : anchor.bottom + GAP,
    left,
    arrow: Math.min(Math.max(centre - left, ARROW_INSET), bubble.width - ARROW_INSET),
  }
}

export interface TooltipBubbleProps {
  label: string
  /**
   * `true` lets a long label turn over at 256 and honours its line breaks — a
   * contact chip's kind above its value, or a sentence on why a control is
   * off. Short labels stay on one line.
   */
  wrap?: boolean
  /** Keeps it shut while true — see `Tooltip`'s `quiet`. */
  quiet?: boolean
  'aria-hidden'?: boolean
  className?: string
}

/**
 * The bubble. **Black at 85%, with white text** (client, 2026-10-13 and 14:
 * "black opacity on MW3 and shown above"), edged in `border-strong`: black on
 * this near-black page would otherwise have no outline to read as an object
 * by. It was the inverted light plate, then solid black.
 *
 * **It points at what it names** (client, 2026-10-12): a small arrow on the
 * side facing the control, as myweb3.me's tooltips have it. A 12px square
 * turned 45° and centred on the bubble's edge, so the half outside reads as a
 * triangle about 17 wide and 8 deep. It carries the edge on its two outer
 * sides and its fill covers the bubble's edge where they meet, so the outline
 * runs unbroken round the point.
 *
 * **Above, unless the screen has no room** — see `place`. To keep that
 * promise it is drawn on the page itself (a portal, fixed to the screen)
 * rather than inside its control: a window's header or a box that hides its
 * overflow used to cut a bubble off, and the answer was to send that one to
 * the side by hand — the wallet pill's, a window's close, the file preview's
 * Copy. Now the screen's edge is the only edge it
 * answers to, and it measures on opening.
 *
 * Shown under the pointer and on **keyboard** focus — not on the focus a
 * click leaves behind, or a pressed button would keep its hover text after
 * the pointer had gone (client, 2026-10-13). It follows the hover group: the
 * nearest `group/tt` around it — a row, a chip — or else the element it sits
 * in, and points at the element it sits in.
 */
export function TooltipBubble({ label, wrap = false, quiet = false, className, ...aria }: TooltipBubbleProps) {
  const marker = useRef<HTMLSpanElement>(null)
  const bubble = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement | null>(null)

  useEffect(() => {
    const anchor = marker.current?.parentElement
    if (!anchor) return
    const group = anchor.closest<HTMLElement>('.group\\/tt') ?? anchor
    const show = () => setOpen(true)
    // Forget where it stood, so the next opening measures afresh and fades in.
    const hide = () => {
      setOpen(false)
      setPlacement(null)
    }
    const focusIn = (event: FocusEvent) => {
      if ((event.target as Element | null)?.matches(':focus-visible')) setOpen(true)
    }
    group.addEventListener('pointerenter', show)
    group.addEventListener('pointerleave', hide)
    group.addEventListener('focusin', focusIn)
    group.addEventListener('focusout', hide)
    return () => {
      group.removeEventListener('pointerenter', show)
      group.removeEventListener('pointerleave', hide)
      group.removeEventListener('focusin', focusIn)
      group.removeEventListener('focusout', hide)
    }
  }, [])

  const shown = open && !quiet

  // Measured once drawn, before it is painted; again if the page scrolls or
  // the window changes under it.
  useLayoutEffect(() => {
    if (!shown) return
    const measure = () => {
      const anchor = marker.current?.parentElement
      if (!anchor || !bubble.current) return
      setPlacement(place(anchor.getBoundingClientRect(), bubble.current.getBoundingClientRect()))
    }
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [shown, label])

  return (
    <>
      <span ref={marker} hidden />
      {shown &&
        createPortal(
          <span
            ref={bubble}
            role="tooltip"
            {...aria}
            style={
              placement
                ? { top: placement.top, left: placement.left, ['--tt-arrow' as string]: `${placement.arrow}px` }
                : { top: 0, left: 0 }
            }
            className={cn(
              'pointer-events-none fixed z-60 rounded-lg border border-border-strong bg-tooltip px-3 py-1.5 text-text type-caption',
              'transition-[opacity] duration-150',
              placement ? 'opacity-100' : 'invisible opacity-0',
              'before:absolute before:left-(--tt-arrow) before:size-3 before:-translate-x-1/2 before:rotate-45 before:rounded-xs before:border-border-strong before:bg-tooltip',
              placement?.side === 'bottom'
                ? 'before:top-0 before:-translate-y-1/2 before:border-t before:border-l'
                : 'before:bottom-0 before:translate-y-1/2 before:border-r before:border-b',
              wrap ? 'w-max max-w-64 text-center whitespace-pre-line' : 'whitespace-nowrap',
              className,
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  )
}

export interface TooltipProps {
  label: string
  children: ReactNode
  wrap?: boolean
  /**
   * Holds the bubble back while true — the copy mark, from the moment it is
   * pressed until the pointer leaves it: the check answers the press, and the
   * word "Copy" standing over it said the opposite (client, 2026-10-13).
   */
  quiet?: boolean
  className?: string
}

/**
 * Hover text for whatever it wraps — the one way this product names a control
 * on hover (client, 2026-10-12: every hover text with the arrow). A native
 * `title` cannot carry the arrow, the plate or the timing, so controls name
 * themselves here and keep `aria-label` for assistive tech.
 *
 * Above the control unless the screen has no room — `TooltipBubble` places
 * it; there is no side to choose.
 */
export function Tooltip({ label, children, wrap, quiet = false, className }: TooltipProps) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <TooltipBubble label={label} wrap={wrap} quiet={quiet} />
    </span>
  )
}
