import type { ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * `default` is the 672 every tools page's line keeps. `wide` is 768, for a
 * line a few characters past it that would otherwise leave one word alone on
 * a second line and pull the first one apart — Trust Lines' line from the
 * client's Canva (2026-10-12) runs to 673. The owner's reading of an orphan
 * like that, on Domain (2026-10-08), is why the measure gives way rather
 * than the words.
 */
const ledeVariants = cva('type-body text-text', {
  variants: {
    measure: {
      default: 'max-w-2xl',
      wide: 'max-w-3xl',
    },
    align: {
      center: 'sm:text-justify-center',
      start: '',
    },
  },
  defaultVariants: { measure: 'default', align: 'center' },
})

export interface PageHeaderProps {
  /** The page's name, at the page-title size. */
  title: ReactNode
  /** The line under it: what the page is for. */
  lede?: ReactNode
  /** See `ledeVariants` — `wide` only for a line just past the standard measure. */
  measure?: 'default' | 'wide'
  /**
   * `center` heads every tool. `start` sets the pair at the left of a
   * document read top to bottom beside a side menu — the policies, as
   * myweb3.me sets theirs (client, 2026-10-13).
   */
  align?: 'center' | 'start'
  className?: string
}

/**
 * A page's title and the line under it, centred. **The page-title standard is
 * the directory's** (client, 2026-10-13): `type-display`, 40, in the heading
 * white — as "Accept XRP? Apply Now" — then **40** to its line, the space the
 * directory leaves between that title and "Need to update your listing?" (39,
 * measured, to the line's box). It was `type-title`, 26, with 16 under it
 * (owner, 2026-10-08), MyWeb3's Subscriptions page's pair.
 *
 * **36 from the line to the page**, as the directory leaves under "Need to
 * update your listing?" (client, 2026-10-13): the page's own 32 between
 * blocks, plus this header's 4 at its foot. The directory's line sits inside
 * a 32-tall button, 6 down from its box, so its 32 reads as 38 from the
 * letters to the card under them; ours, a plain line, read as 33. With the 4
 * it reads 37 — the nearest the 4px grid comes.
 *
 * **The line is white**: it is the page's main description, not a note on
 * it (owner, 2026-10-08). It is held to 672, so a long one turns over at about
 * a hundred characters instead of running the width of the page, and from
 * `sm` its lines run the full 672 with the last one centred — so every
 * page's line starts at the same place, whatever its first line holds. On a
 * phone it is plainly centred: a 343 measure stretched straight would open
 * gaps between the words.
 */
export function PageHeader({ title, lede, measure, align = 'center', className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-10 pb-1',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <h1 className="type-display text-text-heading">{title}</h1>
      {lede && <p className={ledeVariants({ measure, align })}>{lede}</p>}
    </div>
  )
}
