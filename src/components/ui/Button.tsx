import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Reference implementation. Every design-system component follows this shape:
 *   1. `cva` holds ALL styling — variants are data, not scattered conditionals.
 *   2. Semantic tokens and `type-*` roles only. No primitives, no hex, no
 *      raw `text-*` steps.
 *   3. Props extend the native element so it stays a drop-in replacement.
 *   4. `className` passes through last so a screen can nudge layout (margin,
 *      width) without forking the component.
 */
/**
 * Exported so a link can wear a button's styling. Navigation stays a real
 * `<a>` — middle-click, open in a new tab and the browser's own link menu all
 * keep working — where a `<button>` that calls `navigate()` would lose them.
 * XRPL Tools' hub tiles are the first case.
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'select-none cursor-pointer',
    '[&_svg]:size-(--size-icon) [&_svg]:shrink-0',
    'transition-ui',
    // One disabled treatment for every variant — grey plate, grey label —
    // matching the inactive Save button in the file. Not a dimmed version of
    // each variant: disabled should read as the same state everywhere.
    // The `disabled:` pseudo-class outranks the variant classes on specificity,
    // so this wins regardless of cva ordering.
    // `track` is #212121, which is what MW3's inactive Continue measures, and
    // `text-muted` is #8e8e93, which is what its label measures. Both already
    // existed; the disabled button was simply on the wrong one of them.
    'disabled:pointer-events-none disabled:bg-track',
    'disabled:text-text-muted disabled:border-transparent disabled:shadow-none',
  ],
  {
    variants: {
      variant: {
        primary:
          // No disabled override. This kept the brand colour at 30% on the
          // argument that a faded red reads as the same control not yet
          // available, where grey reads as a different one appearing — but
          // MW3 greys it, and the shared rule above already says disabled
          // should look the same everywhere. The variant was the one thing
          // breaking its own rule.
          'bg-accent text-text-on-accent hover:bg-accent-hover active:bg-accent-active',
        secondary:
          'bg-surface-sunken text-text-muted hover:bg-surface-active hover:text-text',
        outline:
          'bg-transparent text-text border border-border-strong hover:border-border-accent hover:bg-surface-hover',
        ghost:
          'bg-transparent text-text hover:bg-surface-hover',
        /**
         * A button that behaves like a link: brand red at rest, blue on hover,
         * no plate and no border. The same colour move the text links make, so
         * an icon-only action reads as "this navigates" rather than as a
         * control with its chrome missing.
         */
        link:
          // Stays flat when disabled. The shared grey plate below makes sense
          // for a button that already has one; on a borderless icon it would
          // pop a disc into existence at the moment of the click.
          'bg-transparent text-accent-text hover:text-link-hover disabled:bg-transparent',
        critical:
          'bg-critical text-text-on-accent hover:brightness-110 active:brightness-95',
      },
      // A labelled size never narrows below a four-letter label — see
      // `--size-button-min-*`. The icon sizes are square and need no floor.
      size: {
        sm: 'h-(--size-control-sm) min-w-(--size-button-min-sm) px-4 type-label-sm',
        md: 'h-(--size-control-md) min-w-(--size-button-min-md) px-5 type-label-md',
        lg: 'h-(--size-control-lg) min-w-(--size-button-min-lg) px-6 type-label',
        xl: 'h-(--size-control-xl) min-w-(--size-button-min-xl) px-8 type-label',
        icon: 'size-(--size-control-md)',
        // `icon` at 32 is a pointer's target, not a thumb's — under the 44px
        // every touch guideline asks for, and the same height as nothing else
        // on a row. This one stands as tall as an `xl` field, so an icon set
        // beside one reads as its pair rather than as something dropped next
        // to it, and a thumb can find it.
        'icon-lg': 'size-(--size-control-xl)',
        pill: 'size-(--size-pill)',
      },
      /**
       * The pill is the button shape in this system — it matches the segmented
       * control and the round icon chips, and it is the default everywhere.
       *
       * `square` exists for one case: a button sitting directly beside an
       * input, where a pill next to an 8px field reads as two unrelated
       * controls. It borrows the field's radius so the pair reads as one.
       */
      shape: {
        pill: 'rounded-full',
        square: 'rounded-lg',
      },
      full: {
        true: 'w-full',
      },
    },
    // A link has no plate, so a floor on its width would only push the words
    // off the line they sit on — it keeps the width of what it says.
    compoundVariants: [{ variant: 'link', className: 'min-w-0' }],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'pill',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, shape, full, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, shape, full }), className)} {...props} />
}
