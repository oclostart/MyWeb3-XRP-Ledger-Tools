import { useState } from 'react'
import { CheckIcon, CopyIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'
import { useClipboard } from '@/lib/useClipboard'
import { cn } from '@/lib/cn'
import { Tooltip } from './Tooltip'

export interface CopyButtonProps {
  /** What goes on the clipboard. */
  value: string
  /** The button's accessible name, when it says more than "Copy" — "Copy address". */
  label?: string
  /** The mark's size: `md` 16, `lg` 20 — beside a figure set large. */
  size?: 'md' | 'lg'
  /** Placement of the whole control — it lands on the tooltip's wrapper. */
  className?: string
}

/**
 * The copy mark as a button: `CopyIcon` in a square the size of a small
 * control, brand red, turning to a green check once copied. Every copy icon
 * is this one, so they answer alike — the SourceTag's number through
 * `CopyField`, and the file preview's whole file.
 *
 * **The mark and the check cross-fade, both ways** (client, 2026-10-12 and
 * 2026-10-13): pressed, the copy mark fades and shrinks as the green check
 * grows into its spot; two seconds on, the check fades back out into the mark
 * — it used to cut straight back, which read as a glitch. Both stand in one
 * grid cell, so nothing shifts while they pass. Under reduced motion they
 * simply swap — the global rule in `index.css` takes the transition's time
 * away.
 *
 * **Its hover text always reads "Copy"** (owner, 2026-10-08), in the arrowed
 * `Tooltip` every hover text uses (client, 2026-10-13) — it was the browser's
 * own `title`. A fuller name, where one helps, goes to assistive tech alone.
 * **Pressed, it lets the hover text go** until the pointer leaves (client,
 * 2026-10-13): the check is the answer, and "Copy" held over it said the
 * opposite.
 */
export function CopyButton({ value, label, size = 'md', className }: CopyButtonProps) {
  const t = useT()
  const { copied, copy } = useClipboard()
  const [pressed, setPressed] = useState(false)

  return (
    <Tooltip label={t('common.copy')} quiet={pressed} className={cn('shrink-0', className)}>
      <button
        type="button"
        onClick={() => {
          setPressed(true)
          void copy(value)
        }}
        onPointerLeave={() => setPressed(false)}
        onBlur={() => setPressed(false)}
        aria-label={label ?? t('common.copy')}
        className={cn(
          'flex size-(--size-control-md) shrink-0 cursor-pointer items-center justify-center rounded-md',
          'text-accent-text transition-ui hover:bg-surface-hover',
          size === 'lg' ? '[&_svg]:size-5' : '[&_svg]:size-4',
        )}
      >
        <span className="grid *:col-start-1 *:row-start-1">
          <CopyIcon className={cn('transition-swap', copied && 'scale-50 opacity-0')} />
          <CheckIcon className={cn('text-positive transition-swap', !copied && 'scale-50 -rotate-12 opacity-0')} />
        </span>
      </button>
    </Tooltip>
  )
}
