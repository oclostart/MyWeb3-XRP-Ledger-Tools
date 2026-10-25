import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean
  /** `xl` (48) clears the touch-target minimum — use it for a page's main input. */
  size?: 'lg' | 'xl' | '2xl'
  /** Leading affordance — a search glyph, a currency sign. */
  leading?: ReactNode
  /**
   * Trailing affordance — a password reveal eye, or an action that belongs to
   * the field itself, like "use my location" on a search box.
   */
  trailing?: ReactNode
}

/**
 * The file fills inputs rather than outlining them: a lighter plate on the
 * dark surface, no visible border until something is wrong.
 *
 * Both affordance slots size the glyph they are given
 * (`[&_svg]:size-(--size-icon)`), the same way `Button` does. Icons from
 * `@/components/icons` carry no width or height by design, so a slot that does
 * not size them renders them at 0x0 — present in the DOM, invisible on screen,
 * and silent about it.
 *
 * The slots are inert by default, so a click that lands on a decorative glyph
 * still focuses the field rather than hitting a dead spot. A `button` or `a`
 * inside takes its events back — the one thing in a slot that is meant to be
 * clicked instead of the input.
 */
export function Input({
  className,
  invalid,
  leading,
  trailing,
  size = 'lg',
  ...props
}: InputProps) {
  const slot = cn(
    'pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-muted',
    '[&_svg]:size-(--size-icon) [&_svg]:shrink-0',
    '[&_a]:pointer-events-auto [&_button]:pointer-events-auto',
  )

  return (
    <div className="relative w-full">
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full rounded-lg px-4',
          size === '2xl'
            ? 'h-(--size-control-2xl) type-body'
            : size === 'xl'
              ? 'h-(--size-control-xl) type-label'
              : 'h-(--size-control-lg) type-body',
          'bg-field text-text',
          // Stated, not inherited. Tailwind's default placeholder is 50% of
          // the current colour, which lands near this token by luck — and
          // would drift the moment the text colour changed, leaving the
          // selects beside it on a different grey.
          'placeholder:text-text-subtle',
          // Invisible until touched: the plate is the field, and the brand
          // stroke on hover is what says it is reachable.
          'border border-transparent',
          'transition-ui',
          'hover:border-border-accent hover:bg-field-hover',
          // The focus ring has the field to itself. `:focus-visible` is a
          // global 2px outline held 2px off the control, and the hover border
          // is a 1px stroke hugging it — in a different red, since the two
          // come from different tokens. Both at once drew two concentric red
          // lines with a dark gap between them, which is what reads as a
          // chipped or doubled edge. Focus wins because it is the one of the
          // two that carries meaning for someone who cannot use a pointer.
          'focus-visible:border-transparent',
          // Off takes no hover: no stroke, no lighter plate — nothing that
          // says it can be reached.
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-transparent disabled:hover:bg-field',
          invalid && 'border-critical',
          leading && 'pl-11',
          trailing && 'pr-12',
          className,
        )}
        {...props}
      />
      {leading && <span className={cn(slot, 'left-4')}>{leading}</span>}
      {trailing && <span className={cn(slot, 'right-4')}>{trailing}</span>}
    </div>
  )
}
