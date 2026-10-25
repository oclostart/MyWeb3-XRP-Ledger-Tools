import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

/**
 * `Input`'s plate, given height. Same fill, same transparent-border-at-rest
 * trick so the brand stroke on hover does not shift the box.
 *
 * `resize-none` on purpose: every textarea in this product has a character
 * limit behind it, so the height is a design decision rather than something to
 * hand to the person typing — and a dragged-out textarea inside a modal pushes
 * the panel past the fold.
 */
export function Textarea({ className, invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full resize-none rounded-lg px-4 py-3',
        'bg-field text-text type-body',
        // Stated, as `Input` states it, so the two kinds of field show their
        // empty words in one grey.
        'placeholder:text-text-subtle',
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
        // Off takes no hover, as `Input` has it.
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-transparent disabled:hover:bg-field',
        invalid && 'border-critical',
        className,
      )}
      {...props}
    />
  )
}
