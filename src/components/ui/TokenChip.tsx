import xrpMark from '@/assets/tokens/xrp.svg'
import rlusdMark from '@/assets/tokens/rlusd.svg'
import usdcMark from '@/assets/tokens/usdc.svg'
import { cn } from '@/lib/cn'
import { Tooltip } from './Tooltip'

/**
 * Supplied token discs. These are whole marks — the coloured circle is part of
 * the artwork — so they render as images rather than as `currentColor` glyphs,
 * and their brand colour is content, the same exemption flags get.
 *
 * A token that is not here falls back to a lettered disc. Redrawing one by
 * hand is not an option.
 */
const MARKS: Record<string, string> = {
  xrp: xrpMark,
  rlusd: rlusdMark,
  usdc: usdcMark,
}

export interface TokenChipProps {
  /** Ticker without the sigil — "XRP", "RLUSD". */
  token: string
  /** Only meaningful for `solid`. */
  accepted?: boolean
  /**
   * `solid` marks acceptance by fill — for a full list where some are not
   * accepted. `outline` is a neutral container, for a list that is already
   * only what the merchant takes, where a highlight would say nothing.
   * `mark` is the coin disc with its ticker beneath, for a row of tokens read
   * as a set rather than as prose.
   */
  variant?: 'solid' | 'outline' | 'mark'
  /**
   * The mark set beside its own ticker, where it has nothing left to say.
   * Drops the tooltip and the accessible name so the pair is announced once,
   * and the hover glow with them — where the coin is not the control, a glyph
   * that lights under the pointer offers a press that does nothing.
   */
  decorative?: boolean
  className?: string
}

/**
 * A currency a merchant takes. `$XRP` leads, the stablecoins follow.
 *
 * The `mark` variant is the supplied token disc, and carries no ticker beneath
 * it — at the size these sit on a card the label doubled the height of the row
 * to repeat what the mark already says. The name survives as the accessible
 * one, so it is still announced and still on hover — unless `decorative` says
 * the ticker is already set beside it in type. **On hover it is the product's
 * hover text** (client, 2026-10-14), above the mark: it was the browser's own
 * `title`, the one hover text the arrowed bubble had not reached.
 */
export function TokenChip({
  token,
  accepted = false,
  variant = 'solid',
  decorative = false,
  className,
}: TokenChipProps) {
  if (variant === 'mark') {
    const mark = MARKS[token.toLowerCase()]
    const disc = mark ? (
      <img
        src={mark}
        alt={decorative ? '' : token}
        className={cn(
          'size-(--size-pill) shrink-0 rounded-full transition-ui',
          // The mark lights up rather than getting an outline. The artwork
          // is the brand's own colour and must not be recoloured, so the
          // brand red arrives as light around the glyph instead of as a tint
          // in it — `drop-shadow` follows the disc's alpha, so it reads as
          // the mark glowing rather than as a box behind it.
          !decorative && 'hover:glow-accent',
          className,
        )}
      />
    ) : (
      <span
        aria-label={decorative ? undefined : token}
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined}
        className={cn(
          'flex size-(--size-pill) shrink-0 items-center justify-center rounded-full',
          'bg-surface-inverse type-label-sm text-canvas',
          className,
        )}
      >
        <span aria-hidden>{token.slice(0, 1)}</span>
      </span>
    )
    return decorative ? (
      disc
    ) : (
      <Tooltip label={token} className="shrink-0">
        {disc}
      </Tooltip>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2 type-label-sm',
        variant === 'outline'
          ? 'border border-border-strong bg-surface-sunken text-text'
          : accepted
            ? 'bg-accent text-text-on-accent'
            : 'bg-surface-active text-text-muted',
        className,
      )}
    >
      ${token}
    </span>
  )
}
