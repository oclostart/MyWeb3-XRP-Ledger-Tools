import { useEffect, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { CloseIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import { Tooltip } from './Tooltip'

/**
 * The dominant composition in this product. Almost nothing happens on a full
 * page: My Account, Payment Methods, Change Password and the rest are all
 * centred panels floating over a blurred, dimmed page (`Official Links - Model`
 * in the file, 32 uses).
 *
 * Anatomy, from the MW3 popups (restyled 2026-10-02 — see below):
 *   title      white, 22/600, **centred**
 *   subtitle   muted grey, directly beneath
 *   controls   optional, top-right, before the close button
 *   footer     a single centred action
 *
 * **It used to be a red title on a red-bordered panel.** That came from the
 * earlier file, where titles were brand red; MW3's own popups are a centred
 * white title on a near-black panel with no border at all, and the directory
 * follows them. The red is now spent where it means something — the one
 * action in the footer — rather than outlining the whole dialog.
 */
const panel = cva(
  [
    // Capped to the overlay's content box, so the panel never outgrows the
    // screen. Vertical padding lives here; horizontal padding is on each band,
    // so the scrolling one can carry its own and the scrollbar sits inside it.
    'relative w-full max-h-full overflow-hidden',
    /**
     * Darker than a card, under a gradient stroke — both from MW3, both
     * measured. Its ground is #080808 against our `canvas` at #08090b, and
     * its edge is brand red run from about 1% at the top-left to about 60% at
     * the bottom-right, so the top is all but invisible and the bottom
     * carries it. `panel-stroke` draws both; see the utility for why a
     * gradient border needs two backgrounds rather than a border colour.
     */
    'panel-stroke rounded-2xl shadow-lg',
    'flex flex-col gap-5 py-6',
  ],
  {
    variants: {
      size: {
        '2xs': 'max-w-(--container-modal-2xs)',
        xs: 'max-w-(--container-modal-xs)',
        sm: 'max-w-(--container-modal-sm)',
        md: 'max-w-(--container-modal-md)',
        lg: 'max-w-(--container-modal-lg)',
        /**
         * As wide as its content, padding unchanged: a one-line question
         * stays one line. Never under `2xs` — the title needs that room to
         * clear the close button — nor past `sm`, where it turns over; on a
         * phone it fills the screen and wraps like any other.
         */
        fit: 'w-fit min-w-[min(100%,var(--container-modal-2xs))] max-w-(--container-modal-sm)',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface ModalProps extends VariantProps<typeof panel> {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /**
   * `muted` grey by default. `default` sets it in the text white, for a line
   * that is the instruction the window exists to give — Sign with Xaman's
   * "Open the Xaman app and scan this QR code." (client, 2026-10-13).
   */
  subtitleTone?: 'muted' | 'default'
  /** Extra controls in the header, to the left of the close button. */
  controls?: ReactNode
  /**
   * A mark at the header's top-left, opposite the close button — the merchant
   * modal puts the country flag there. Kept separate from `controls` because
   * that slot rides the close button on the right; this one is the other
   * corner, and a centred title needs both corners to stay out of its way.
   */
  leading?: ReactNode
  /**
   * Replaces the title/subtitle block when the panel leads with content rather
   * than a label — a merchant's identity, say. `title` is still required, and
   * still names the dialog for assistive tech.
   */
  header?: ReactNode
  /**
   * `center` is the default, and what MW3 does: the title centred on the
   * panel with the close button floated over the right edge. `start` sets it
   * beside the close button instead — kept for a panel whose header carries
   * enough that centring it would fight the corners.
   */
  headerAlign?: 'start' | 'center'
  /** A single centred action, as the file does with Save. */
  footer?: ReactNode
  /**
   * Whether pressing the page behind the panel closes it. Default `false`.
   *
   * It used to default to `true`, and that is the wrong way round for this
   * product: every panel here carries a close control, so the X is the stated
   * way out and a press on the page behind is far more likely to be a misplaced
   * click than a decision. Losing a half-typed email or a profile mid-read to
   * one costs more than the extra press ever does. Escape and the X still work,
   * so it is never a trap.
   */
  closeOnOverlay?: boolean
  /**
   * Whether the panel can be dismissed at all. Default `true`.
   *
   * `false` removes the close control **and** the Escape route, for an outcome
   * that has to be acknowledged rather than waved away — an application
   * submitted, a listing updated, a link sent. The footer action is then the
   * only way out, so a panel with no footer must never set this.
   *
   * It used to be `NoticeModal`'s alone, where it only replaced `onClose` with
   * a no-op: the X was still drawn, still focusable, and did nothing when
   * pressed. A control that is visible and inert is worse than one that is
   * absent, so the real answer had to live here, where the button is.
   */
  dismissible?: boolean
  /**
   * Makes the panel a form: Enter in any field runs this, and so does the
   * footer button, which submits by default once it is inside one.
   *
   * Without it a prompt with a single field still needs the pointer — people
   * type an address and press Enter, and nothing happens. Give the footer
   * button no `onClick` when this is set, or the action fires twice.
   */
  onSubmit?: () => void
  children: ReactNode
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  subtitleTone = 'muted',
  controls,
  leading,
  header,
  headerAlign = 'center',
  footer,
  closeOnOverlay = false,
  dismissible = true,
  onSubmit,
  size,
  children,
  className,
}: ModalProps) {
  const t = useT()

  useEffect(() => {
    if (!open || !dismissible) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissible])

  /**
   * Hold the page still underneath.
   *
   * The panel is fixed to the viewport, so a page that still scrolls behind it
   * reads as the modal sliding — and once the body reaches its end the wheel
   * hands the scroll to the page, which is how people lose their place. The
   * previous value is restored rather than cleared, so nesting cannot leave
   * the page locked.
   */
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  /**
   * Where the header's corners sit against the title.
   *
   * The flag and the close glyph are floated over the title rather than set
   * beside it — see the row below for why — so nothing tells them where to
   * sit, and they simply hung from the header's top edge.
   *
   * **MW3 does not centre them on the title; it sets them on its cap line.**
   * Measured off the prompt frames — `Account Verified`, `Change Username` and
   * `Change Password` all agree — the panel puts its title box at y=32 and the
   * 32px close at y=24, so the glyph centres at 40 against a title box centred
   * at 49. Nine pixels high, and the title's cap top is at 41.9: the close
   * rides the top of the lettering, not its middle.
   *
   * Reproduced rather than copied, because their title box is 34 where ours is
   * 28 — they took Titillium Web's natural line box (ascent 25 + descent 9 at
   * 22px, no leading) and our scale sets 22/28. So the band is the title's own
   * line-height, which centres the corners on it, and `-mt-2` then lifts them
   * to the cap line. Titillium's cap top falls at 6.9 in a 28px box and 7.7 in
   * a 32px one, so the single 8px lift serves both within a pixel.
   *
   * Named, not numbered: the default title is `type-title-sm`, and the band is
   * that role's own line-height, so retyping the title moves the corners with
   * it. A `header` slot brings its own type and keeps the control-sized band
   * it was drawn against.
   */
  const corner = cn('-mt-2', header ? 'min-h-(--size-control-md)' : 'h-(--text-2xl--line-height)')

  return (
    <div
      // The overlay does not scroll. The panel is capped to this box and its
      // body scrolls inside — so the header, the close button and the footer
      // action stay put on screen however long the content is. Centring is
      // safe again for the same reason: nothing can overflow this container.
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(panel({ size }), className)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 px-6">
          {/* The positioning context is this inner box, not the `<header>`.
              `absolute right-0` resolves against the padding box, so anchoring
              to the header put the close button hard against the panel edge —
              where the panel's own `overflow-hidden` clipped its hover ring.
              Inside the padding, `right-0` is the content edge, and it stays
              correct if that padding ever changes. */}
          <div
            className={cn(
              'relative flex items-start gap-4',
              // Centring has to float the close button, not sit beside it —
              // as a flex sibling it steals width from one side only, which
              // leaves the title off-centre by half the button.
              headerAlign === 'center' ? 'justify-center text-center' : 'justify-between',
            )}
          >
            {leading && (
              // Given the same band as the close button, so the two corners
              // centre on the title's line rather than hanging from the top of
              // the header — a 20px flag left top-aligned reads 6px high
              // against a title and a close button that are both taller.
              <div
                className={cn(
                  'flex shrink-0 items-center gap-3',
                  corner,
                  headerAlign === 'center' && 'absolute top-0 left-0',
                )}
              >
                {leading}
              </div>
            )}
            {header ?? (
              <div className="flex flex-col gap-2">
                <h2 className="type-title-sm text-text">{title}</h2>
                {subtitle && (
                  <p className={cn('type-body', subtitleTone === 'default' ? 'text-text' : 'text-text-muted')}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            <div
              className={cn(
                'flex shrink-0 items-center gap-3',
                corner,
                headerAlign === 'center' && 'absolute top-0 right-0',
              )}
            >
              {controls}
              {/* The glyph sits in a 32px circle so the hover stroke has a
                  shape to trace — a ring around a bare 20px X would have hugged
                  the glyph's own bounding box and read as a box, not a button.
                  A ring rather than a border: it is drawn outside the box, so
                  nothing reflows the header when it appears.

                  The glyph no longer dims on hover. Dimming says "less
                  available" about the one control that is always available; the
                  brand stroke says "this is the thing you are pointing at",
                  which is what a hover is for.

                  Hover text as well as `aria-label`, and keyboard focus gets
                  the same ring: the two reach different people — the tooltip
                  a pointer, the label a screen reader — and neither
                  affordance should be mouse-only. The hover text is the
                  arrowed `Tooltip`, as every hover text is (client,
                  2026-10-13); it was the browser's own `title`. Both strings
                  come from the locale. */}
              {dismissible && (
              <Tooltip label={t('common.close')}>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className={cn(
                  'flex size-(--size-control-md) shrink-0 cursor-pointer items-center justify-center',
                  'rounded-full text-text transition-ui',
                  'hover:ring-2 hover:ring-accent',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                  // 14px, not the 20 of `--size-icon`. Measured off the MW3
                  // frames, where the glyph is 14x14 inset 33px from both
                  // edges — its centre lands in the same place as ours did, so
                  // what read as the wrong position was only the wrong size.
                  '[&_svg]:size-3.5',
                )}
              >
                <CloseIcon />
              </button>
              </Tooltip>
              )}
            </div>
          </div>
        </header>

        {/* The only part that scrolls. `min-h-0` is what makes it possible —
            a flex item's default `min-height: auto` refuses to shrink below
            its content, so without it the panel would grow past its own cap
            and the overflow would move back to the page.

            `overflow-x-hidden` is load-bearing, not tidying. Setting only
            `overflow-y` makes `overflow-x` compute to `auto`, and the two axes
            then reserve room for each other: the vertical bar narrows the box,
            which asks for a horizontal bar, which shortens it, which keeps the
            vertical one. A one-sentence modal ended up with 15px of gutter on
            both axes and nothing to scroll. Nothing here should ever scroll
            sideways anyway.

            `pb-px` cures a second, separate one. Text boxes land on fractional
            heights and the browser rounds the scroll height up while rounding
            the client height down, so a 40px paragraph in a 40px box reports
            41 and draws a bar. One pixel of slack absorbs it; real overflow
            still scrolls. Both are needed — each was verified to reappear
            without the other.

            `-mt-3 pt-3` and `-mb-3 pb-3` are bleed, not spacing. Overflow
            clips at the padding box, so anything drawn outside its own box —
            a ring, a shadow, a focus outline — is cut flat against this edge.
            The padding gives it 12px to draw into and the matching negative
            margin takes those 12px back from the gap outside, so nothing
            moves; only the clip line does. Spacing inside the body stays the
            panel's one `gap-5`.

            Both ends, because both ends bite. The top cut a token mark's
            hover ring into an arc. The bottom cut 3px off the focus outline
            of the last field in the panel — `:focus-visible` is 2px held 2px
            off, so it reaches 4px past the control, and `pb-px` left it one.
            A ring sliced flat along the bottom reads as a chipped edge, which
            is exactly what it is.

            12px rather than the 4 an outline needs, so a child can also be
            pulled up or down against the grain — `MerchantProfileModal`
            tightens its token row that way — and still have room to draw.
            `pb-3` also subsumes the `pb-px` that used to sit here for the
            fractional-height scrollbar; the checks below confirm no bar
            returns. */}
        {(() => {
          const body = (
            <>
              <div className="-mt-3 -mb-3 flex min-h-0 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain px-6 pt-3 pb-3">
                {children}
              </div>

              {footer && <div className="flex shrink-0 justify-center px-6">{footer}</div>}
            </>
          )

          // The form wraps the body *and* the footer, so the action button is
          // inside it and submits without being wired up. It carries the
          // panel's own `gap-5` and `min-h-0`, because it takes the body's
          // place as the flex child that is allowed to shrink.
          return onSubmit ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
              }}
              className="flex min-h-0 flex-col gap-5"
            >
              {body}
            </form>
          ) : (
            body
          )
        })()}
      </div>
    </div>
  )
}
