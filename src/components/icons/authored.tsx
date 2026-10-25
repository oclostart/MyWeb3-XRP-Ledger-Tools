/* Hand-authored icons. NOT generated — `scripts/build-icons.mjs` never touches
   this file, and nothing here has a source SVG behind it.

   These are plain geometry with no counterpart in the Figma file: a cross, a
   plus, a minus, three bars, two sheets. Unlike a brand mark there is nothing
   to misrepresent by drawing one, and each is a couple of stroked lines where
   a traced export would be a page of coordinates.

   They used to live in the generated module, which was a trap rather than a
   decision: that file is rewritten from `src/assets/icons/*.svg` on every run,
   so the next `node scripts/build-icons.mjs` would have deleted all four — and
   `CloseIcon` is on every modal. Same folder, same barrel, different file. */

import type { IconProps } from './types'

/**
 * Back — an arrow pointing left.
 *
 * Added 2026-10-12 for the xrp-ledger.toml builder, where the client asked for
 * a back mark in place of the word. Built to `MinusIcon`'s geometry — a 16
 * box, 1.5 stroke, round caps and joins — so it sits with the authored family:
 * the shaft is `MinusIcon`'s bar run the width of the box, and the head's two
 * strokes meet on it at 45 degrees.
 */
export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path
        d="M13 8H3M7.5 3.5L3 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The close mark on a modal, drawn the way MW3 draws it.
 *
 * `JamCloseIcon` is a traced path with thin, sharp arms; this is two strokes
 * with round caps, which is what the reference frames show. Measured off them:
 * a 14px glyph whose arms scan 3-4px across the diagonal, so about 2.5px of
 * perpendicular stroke. The viewBox is 14 rather than 16 so the geometry is
 * literally those numbers.
 */
export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden focusable="false" {...props}>
      <path
        d="M1.5 1.5l11 11M12.5 1.5l-11 11"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Copy — two sheets, the back one showing above and to the right of the front.
 *
 * Added 2026-10-07 for the XRPL Tools account card, where the owner asked for
 * an icon in place of the word. Built to `MinusIcon`'s geometry — a 16 box,
 * 1.5 stroke, round joins — so it sits with the authored family. The front
 * sheet is an 8px square; the back one is the same square moved up and right
 * by 2.5, drawn only where the front does not cover it.
 */
export function CopyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <rect x="2.75" y="5.25" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.25 5.25v-1a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The nav's overflow control on a phone — three bars.
 *
 * Built to `MinusIcon`'s geometry — a 16 box, 1.5 stroke, round caps — so the
 * three read as one family. The bars sit on 4/8/12, which is the 4px grid.
 */
export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path
        d="M2.5 4h11M2.5 8h11M2.5 12h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The map's own zoom pair. Drawn as strokes rather than traced paths, because
 * these two are plain geometry — a traced plus is a lot of coordinates for a
 * cross, and a stroked one stays crisp at any size the control takes.
 */
export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * A balance scale — the mark on the Set Stablecoin Trust Lines tile, as the
 * client's Canva draws it (2026-10-12): a post on a foot, a beam across the
 * top, and a pan hung from each end.
 *
 * The authored family's geometry — a 16 box, 1.5 stroke, round caps and
 * joins. Each pan is a bowl under a straight rim, hung from the beam's end by
 * two strokes that meet there.
 */
export function ScaleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path
        d="M8 2.5v11M5 13.5h6M3 4.5h10M3 4.5L1.25 9M3 4.5L4.75 9M13 4.5L11.25 9M13 4.5L14.75 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.25 9h3.5a1.75 1.75 0 0 1-3.5 0zM11.25 9h3.5a1.75 1.75 0 0 1-3.5 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * A calendar — the date picker's mark, where a dropdown has its caret.
 *
 * Added 2026-10-13 with `DatePicker`, when the client asked for a better
 * calendar than the browser's own. `ArrowLeftIcon`'s geometry: a 16 box, 1.5
 * stroke, round caps and joins — a page with a header rule and two rings.
 */
export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path
        d="M4 3.5h8A1.5 1.5 0 0 1 13.5 5v7A1.5 1.5 0 0 1 12 13.5H4A1.5 1.5 0 0 1 2.5 12V5A1.5 1.5 0 0 1 4 3.5ZM2.5 6.5h11M5.5 2v3M10.5 2v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * A chevron pointing left — a step back through a sequence, the date
 * picker's previous month. Turned half a turn for the next. Added 2026-10-13,
 * `ArrowLeftIcon`'s head without its shaft.
 */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden focusable="false" {...props}>
      <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
