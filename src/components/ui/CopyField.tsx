import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { CopyButton } from './CopyButton'

/**
 * `md` is a value carried alongside other content — a wallet address under a
 * name. `lg` is a value that *is* the content: the answer a tool exists to
 * give, such as a SourceTag. It sets the value at title size and centres the
 * pair, because at that size the copy action belongs to the number rather than
 * to the far edge of a row — so the mark stands 4 off it, 10 to its ink
 * (client, 2026-10-13: "closer to the number"; it was 12).
 */
const field = cva('flex min-w-0 items-center', {
  variants: {
    size: {
      md: 'gap-2',
      lg: 'justify-center gap-1',
    },
  },
  defaultVariants: { size: 'md' },
})

const valueText = cva('min-w-0', {
  variants: {
    /**
     * Breaks a long value across lines instead of cutting it short. For a
     * value someone checks before acting on it — an account address before
     * signing — where the end of it is the part people compare, and an
     * ellipsis would hide exactly that.
     */
    wrap: {
      true: 'break-all',
      false: 'truncate',
    },
    // `md` reads at running-text size — the owner asked for the account
    // address to match the tool descriptions around it (2026-10-07).
    size: {
      md: 'flex-1 type-body',
      // Titillium, not the `<code>` element's monospace: a figure is set in
      // the brand face like every other one. A small address keeps the
      // monospace, where telling `l` from `1` is the whole job. `type-title`,
      // 26 — it was `type-display`, 40, until the client asked for the
      // SourceTag smaller (2026-10-13).
      lg: 'font-sans type-title',
    },
    /**
     * `value` is the blue of a value on the ledger, or derived for it — the
     * SourceTag a domain hashes to (`--color-value`). `default` leaves the
     * size's own colour.
     */
    tone: {
      default: '',
      value: 'text-value',
    },
  },
  compoundVariants: [
    { size: 'md', tone: 'default', className: 'text-text-muted' },
    { size: 'lg', tone: 'default', className: 'text-text' },
  ],
  defaultVariants: { size: 'md', wrap: false, tone: 'default' },
})

export interface CopyFieldProps extends VariantProps<typeof field> {
  value: string
  /**
   * `center` sets the value on the centre line of whatever holds it, with the
   * copy mark beside it rather than pulling it off centre: an invisible twin
   * of the mark stands on the other side, so the two flanks weigh the same
   * and a wrapped value centres its lines under a centred title.
   */
  align?: 'start' | 'center'
  /** See `tone` above — `value` sets it in the ledger-value blue. */
  tone?: 'default' | 'value'
  /** See `wrap` above — never cut a value that is checked before acting. */
  wrap?: boolean
  /** Accessible name for the copy button. */
  label?: string
  className?: string
}

/**
 * A long machine value with the copy mark beside it — the one copy affordance
 * across the app (client, 2026-10-12: the word Copy gave way to the mark
 * everywhere). The value stays selectable; the button is a shortcut, not the
 * only route.
 */
export function CopyField({ value, label, size, wrap, tone, align = 'start', className }: CopyFieldProps) {
  return (
    <div className={cn(field({ size }), align === 'center' && 'justify-center', className)}>
      {align === 'center' && <span aria-hidden className="invisible size-(--size-control-md) shrink-0" />}
      <code className={cn(valueText({ size, wrap, tone }), align === 'center' && 'text-center')}>{value}</code>
      {/* At `lg` the mark grows with the figure it belongs to. */}
      <CopyButton value={value} label={label} size={size === 'lg' ? 'lg' : 'md'} />
    </div>
  )
}
