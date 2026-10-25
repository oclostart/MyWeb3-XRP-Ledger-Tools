import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface StepperStep {
  label: string
  /** How many entries the step holds, for a step that repeats — "Principals (2)". */
  count?: number
}

export interface StepperProps {
  steps: ReadonlyArray<StepperStep>
  /** Index of the step in progress. Those before it are done. */
  current: number
  /** Accessible name for the whole track — "Steps". */
  label: string
  /**
   * The one line a phone gets instead of every label, already translated —
   * "Step 3 of 8 · Validators". Nine labels do not fit on a phone at any size
   * worth reading, and a dot row alone says how far, not where.
   */
  summary: string
  /**
   * Makes each step a button that opens it — the toml builder's timeline
   * (client, 2026-10-13). Absent, the track is display only.
   */
  onSelect?: (index: number) => void
  className?: string
}

/**
 * Where someone is in a long errand: a dot per step on one line, the track
 * behind the current step in brand red, the current dot white and larger, the
 * rest grey.
 *
 * The owner's colours (2026-10-07). Done was green at first, on `Check`'s
 * "you have this"; but a green the brand does not use, on a track the brand
 * red already leads, read as a second accent rather than as progress. The
 * current dot is the light plate, the one place on the track the eye should
 * land. Display only by default.
 *
 * **With `onSelect` every step is a button** (client, 2026-10-13: "browse to
 * the section by clicking on the bullet"): the whole column — label and dot —
 * is the target, the dot takes a brand-red ring under the pointer and its
 * label the white, and the current step stays put. It was display only, on
 * the reasoning that a jump skips the form's checks; the builder keeps what
 * is typed and checks on Next and Download, so a jump loses nothing.
 *
 * **Labels alternate above and below the line**, as the Canva draws it: each
 * label then has two steps' width to sit in rather than one, which is what
 * lets eight of them stand at full size across a form column without
 * colliding. Below `md` they give way to `summary`.
 */
export function Stepper({ steps, current, label, summary, onSelect, className }: StepperProps) {
  return (
    <nav aria-label={label} className={cn('flex w-full flex-col gap-2', className)}>
      <ol className="flex w-full">
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
          const text = step.count ? `${step.label} (${step.count})` : step.label
          // Every step carries both slots, so the line sits at one height in
          // all of them; only one slot shows its text.
          const above = i % 2 === 0

          return (
            <li
              key={step.label}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <Step onClick={onSelect && state !== 'current' ? () => onSelect(i) : undefined}>
                <span
                  className={cn(
                    'h-4 type-caption whitespace-nowrap max-md:sr-only',
                    !above && 'md:invisible',
                    state === 'current' ? 'text-text' : 'text-text-muted group-hover/step:text-text',
                  )}
                >
                  {above && text}
                </span>

                <span className="relative my-2 flex h-4 w-full items-center justify-center">
                  {/* Half a line either side of the dot, so the track runs
                      edge to edge between the first dot and the last. */}
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute top-1/2 right-1/2 left-0 h-px',
                        i <= current ? 'bg-accent' : 'bg-border-strong',
                      )}
                    />
                  )}
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute top-1/2 right-0 left-1/2 h-px',
                        i < current ? 'bg-accent' : 'bg-border-strong',
                      )}
                    />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      'relative rounded-full transition-ui',
                      state === 'current' ? 'size-4 bg-surface-inverse' : 'size-3 group-hover/step:ring-2 group-hover/step:ring-accent',
                      state === 'done' && 'bg-accent',
                      state === 'upcoming' && 'bg-border-strong',
                    )}
                  />
                </span>

                <span
                  className={cn(
                    'h-4 type-caption whitespace-nowrap max-md:sr-only',
                    above && 'md:invisible',
                    state === 'current' ? 'text-text' : 'text-text-muted group-hover/step:text-text',
                  )}
                >
                  {!above && text}
                </span>
              </Step>
            </li>
          )
        })}
      </ol>
      <p aria-hidden className="text-center type-caption text-text-muted md:hidden">
        {summary}
      </p>
    </nav>
  )
}

/**
 * One step's column: a button the width of the column when the track can be
 * walked, a plain box when it cannot — so the dot, its label and the space
 * between them are one target.
 */
function Step({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  if (!onClick) return <div className="flex w-full flex-col items-center">{children}</div>
  return (
    <button type="button" onClick={onClick} className="group/step flex w-full cursor-pointer flex-col items-center">
      {children}
    </button>
  )
}
