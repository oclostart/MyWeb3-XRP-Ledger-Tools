#!/usr/bin/env node
/**
 * Turn the SVGs exported from Figma into a typed React icon module.
 *
 * This script owns `src/components/icons/generated.tsx` and nothing else. It
 * rewrites that file in full on every run, so whatever is not in `SRC` is gone
 * — which is why hand-authored glyphs live in `authored.tsx` beside it, out of
 * reach, and why `IconProps` lives in `types.ts` rather than in the file this
 * script is free to discard. `index.ts` is the barrel that re-exports all
 * three; everything imports from there.
 *
 * Four icons used to sit in the generated file with no source behind them —
 * a cross, a plus, a minus, three bars. One run of this script would have
 * deleted them, and `CloseIcon` is on every modal. Split 2026-10-03.
 *
 * Geometry is copied verbatim — paths are never redrawn. The only changes are
 * to make the glyphs usable in a token-driven system:
 *   - baked paints (#8C1515, white, #191919) become `currentColor`
 *   - fixed width/height are dropped so CSS sizes them
 *   - `id` attributes are stripped (they would duplicate in the DOM)
 *   - `preserveAspectRatio="none"` is dropped so glyphs never distort
 *
 * Most of these are Figma exports. Four are not:
 *   - `tag.svg` and `at.svg` are Phosphor Icons 2.1.1 (MIT), regular weight,
 *     from the official @phosphor-icons/core package — added 2026-10-06 for
 *     XRPL Tools. The file's own globe is Phosphor (ph:globe), so they share
 *     its weight. Their fill sits on the path rather than the root, because
 *     this script replaces the root with its own `fill="none"` one.
 *   - `crown.svg` is authored here — a generic glyph with no source in the
 *     file, and unlike a brand mark there is nothing to misrepresent by
 *     drawing one. It is an SVG asset rather than a component in
 *     `authored.tsx` because it is a traced shape, not two stroked lines.
 *   - `xrp.svg` is the official XRP mark, supplied as an asset. Geometry is
 *     verbatim; only the baked white fill and the class-based styling were
 *     removed so `currentColor` and the JSX conversion apply. A trademark is
 *     never redrawn by hand — replace the asset, never edit the path.
 *
 * Re-run after re-exporting from Figma:  node scripts/build-icons.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'src/assets/icons'
const OUT = 'src/components/icons/generated.tsx'


/**
 * Figma exports each icon as its inner *group* bounding box, discarding the
 * offset that positioned it inside the 24x24 icon frame. Rendered as-is the
 * glyph would fill the whole box — too large, and distorted where the group is
 * not square.
 *
 * These offsets are recovered from the `inset-[...]` percentages in the
 * get_design_context output for each icon, then baked in by shifting the
 * viewBox origin: `viewBox="-x -y 24 24"` restores the designed placement and
 * gives every icon a uniform 24x24 box. Path data is never touched.
 *
 * Each entry was verified against the exported group dimensions (see `size`).
 * Icons Figma exported at a true 24x24 are absent — they need no offset.
 */
const FRAME_OFFSET = {
  'checkbox-line': { x: 3,     y: 3,    size: '18 x 20.814' },
  coin:            { x: 3,     y: 3,    size: '18 x 20.814' },
  film:            { x: 2,     y: 3,    size: '20 x 20.814' },
  flag:            { x: 5,     y: 4,    size: '15 x 17'     },
  logout:          { x: 3,     y: 3,    size: '18 x 18'     },
  music:           { x: 2,     y: 3,    size: '18 x 18'     },
  paper:           { x: 3.75,  y: 1.5,  size: '16.5 x 21'   },
  scope:           { x: 2,     y: 3,    size: '20 x 20.814' },
  settings:        { x: 1.823, y: 1.25, size: '20.356 x 21.5' },
  eye:             { x: 4,     y: 4,    size: '16 x 16'      },
  // Not a Figma frame quirk like the rest of this table — tabler's trash is
  // exported at its own 18x20 bounds, and this centres it in the 24 box the
  // other icons share: (24-18)/2 and (24-20)/2.
  trash:           { x: 3,     y: 2,    size: '18 x 20'      },
  mail:            { x: 2,     y: 4,    size: '20 x 16'      },
}

/**
 * The bare tick is not a 24px icon — it sits inside the 16px Check circle.
 * Centre it in a 16 box at its natural size: (16 - 9.048)/2, (16 - 6.554)/2.
 */
const CUSTOM_BOX = {
  check: { x: 3.476, y: 4.723, box: 16 },
  /** The caret is drawn in a 16 box, inset 29.3% vertically, 15.62% either side. */
  'caret-down': { x: 2.5, y: 4.688, box: 16 },
}

const pascal = (s) => s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase())

/** A square export needs no correction — its viewBox already frames the glyph. */
const NATURAL = /^0 0 (\d+(?:\.\d+)?) \1$/

const JSX_ATTR = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity',
}

function convert(svg, key) {
  let viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24'
  const off = FRAME_OFFSET[key] ?? CUSTOM_BOX[key]
  if (off) {
    const box = off.box ?? 24
    viewBox = `${-off.x} ${-off.y} ${box} ${box}`
  } else if (!NATURAL.test(viewBox)) {
    // Not in the manifest and not a square full-frame export: the offset is
    // unknown, so flag it rather than guessing and cropping the glyph.
    console.warn(`  ! ${key}: viewBox "${viewBox}" is not square and has no FRAME_OFFSET entry`)
  }
  let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

  inner = inner
    // Paint → currentColor, but never touch `none`.
    .replace(/(fill|stroke)="(?!none")[^"]*"/g, '$1="currentColor"')
    .replace(/\s+id="[^"]*"/g, '')
    .replace(/\s+(width|height|preserveAspectRatio|overflow|style)="[^"]*"/g, '')

  for (const [kebab, camel] of Object.entries(JSX_ATTR)) {
    inner = inner.replace(new RegExp(`\\b${kebab}=`, 'g'), `${camel}=`)
  }

  inner = inner
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n      ')

  return { viewBox, inner }
}

const files = readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort()

const body = files
  .map((file) => {
    const key = file.replace('.svg', '')
    const name = pascal(key) + 'Icon'
    const { viewBox, inner } = convert(readFileSync(join(SRC, file), 'utf8'), key)
    return `export function ${name}(props: IconProps) {
  return (
    <svg viewBox="${viewBox}" fill="none" aria-hidden focusable="false" {...props}>
      ${inner}
    </svg>
  )
}`
  })
  .join('\n\n')

writeFileSync(
  OUT,
  `/* GENERATED by scripts/build-icons.mjs — do not edit by hand.
   Source: src/assets/icons/*.svg, exported from the MW3 Figma file.
   Rewritten in full on every run: anything added here is lost. Hand-authored
   glyphs belong in ./authored.tsx, which this script never touches.
   Re-run after re-exporting:  node scripts/build-icons.mjs            */

import type { IconProps } from './types'

${body}
`,
)

console.log(`✓ generated ${files.length} icons → ${OUT}`)
