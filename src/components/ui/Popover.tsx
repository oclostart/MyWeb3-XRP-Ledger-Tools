import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface PopoverProps {
  /**
   * Accessible name for the trigger. Required — the trigger is a glyph, and a
   * glyph names nothing.
   */
  label: string
  /** What the trigger shows. Usually one icon. */
  trigger: ReactNode
  /**
   * `controls` spaces a group of controls, each in its own box — the phone
   * header's settings. `list` is the language menu's own list: 4 of padding,
   * rows 4 apart, rising in as it opens — so a menu of links beside the
   * language picker reads as one of a set (the tools' Tools menu, client
   * 2026-10-13).
   */
  body?: 'controls' | 'list'
  /**
   * Which edge of the trigger the panel hangs from. `end` for a control in a
   * header's right corner, where a panel growing rightward would leave the
   * screen.
   */
  align?: 'start' | 'end'
  children: ReactNode
  className?: string
}

/**
 * A button that discloses a panel of controls beneath itself.
 *
 * Disclosure semantics, not menu semantics: `aria-expanded` on a button and
 * ordinary content in the panel. A `menu` role would promise a list of
 * commands that arrow keys walk — what goes in here is a group of controls
 * that each own their own keyboard, and claiming otherwise would have a screen
 * reader announce a menu and then hand over two dropdowns that do not behave
 * like menu items.
 *
 * The panel is positioned, not portalled. Anything it contains that opens its
 * own layer — `Listbox` does — is absolutely positioned against itself, so it
 * escapes this box on its own; nothing here may set `overflow`, or it would
 * clip the list of a dropdown it is holding.
 *
 * Dismissal matches `Listbox`, deliberately: an outside press, a focus leaving
 * the control, or Escape. Three ways out, and the same three everywhere a
 * layer opens in this system.
 */
export function Popover({ label, trigger, body = 'controls', align = 'end', children, className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Anything open *inside* the panel gets the first refusal, so one press
      // closes one layer: a dropdown first, this second.
      //
      // Scoped to the panel, not to the root — the root holds the trigger, and
      // the trigger carries `aria-expanded="true"` the whole time this is open.
      // Asking the root the question meant the answer was always yes and the
      // key never reached here.
      if (panel.current?.querySelector('[aria-expanded="true"]')) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // The control height the header's dropdowns use, square — so the
          // burger and the pickers it replaces occupy the same band.
          'flex size-(--size-control-lg) cursor-pointer items-center justify-center',
          'rounded-lg border border-surface bg-field text-text transition-ui',
          'hover:border-border-accent',
          // Focus takes the border back, for the reason `Listbox` gives: the
          // global focus outline and the hover stroke drawn together read as a
          // doubled edge.
          'focus-visible:border-surface',
          '[&_svg]:size-(--size-icon)',
        )}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={panel}
          id={`${id}-panel`}
          className={cn(
            'absolute top-full z-50 mt-2 flex min-w-max flex-col',
            'rounded-lg border border-border bg-surface-raised shadow-lg',
            body === 'list' ? 'animate-rise-in gap-1 p-1' : 'gap-3 p-3',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
