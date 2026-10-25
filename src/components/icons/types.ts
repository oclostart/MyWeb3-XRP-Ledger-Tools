import type { SVGProps } from 'react'

/**
 * Every icon in this folder takes the same props, and the type lives apart
 * from all of them so neither side owns it.
 *
 * `generated.tsx` is rewritten wholesale by `scripts/build-icons.mjs` and
 * `authored.tsx` is written by hand; if the type lived in either, the other
 * would have to import from a sibling it has no business depending on — and
 * the generated file would be importing from a file it is allowed to delete.
 */
export type IconProps = SVGProps<SVGSVGElement>
