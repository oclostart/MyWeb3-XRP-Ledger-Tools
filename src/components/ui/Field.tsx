import { useId, type ReactElement, type ReactNode, cloneElement } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: string
  /** Marks the label with the required asterisk and sets `required` on the control. */
  required?: boolean
  /**
   * A short tag beside the label. The application form uses it for `Public`,
   * which is the only thing on that page a merchant cannot infer: every field
   * looks alike, but only some of them end up in the directory.
   */
  badge?: ReactNode
  hint?: string
  error?: string
  className?: string
  children: ReactElement<{ id?: string; invalid?: boolean; required?: boolean }>
}

/**
 * Label + control + message. Wiring `htmlFor`/`id` here rather than at each
 * call site is what keeps the association from being forgotten on some screen.
 *
 * The asterisk is `aria-hidden` and paired with a real `required` on the
 * control — a screen reader announces the state, it does not read punctuation
 * out of a label.
 */
export function Field({
  label,
  required,
  badge,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const id = useId()
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="type-label-sm text-text">
          {label}
          {required && (
            <span aria-hidden className="pl-0.5 text-accent-text">
              *
            </span>
          )}
        </label>
        {badge && <span className="type-micro text-positive">{badge}</span>}
      </span>
      {cloneElement(children, {
        id,
        required: required ?? children.props.required,
        invalid: Boolean(error) || children.props.invalid,
      })}
      {(error || hint) && (
        <p className={cn('type-caption', error ? 'text-critical' : 'text-text-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
