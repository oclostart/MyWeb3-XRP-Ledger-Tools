/**
 * The icon vocabulary, from two sources that must not share a file.
 *
 * `generated.tsx` is rewritten wholesale by `scripts/build-icons.mjs` from the
 * SVGs in `src/assets/icons/`. `authored.tsx` is written by hand, for glyphs
 * with no counterpart in the Figma file. Everything imports from here and
 * neither distinction leaks past this line.
 */
export type { IconProps } from './types'
export * from './generated'
export * from './authored'
