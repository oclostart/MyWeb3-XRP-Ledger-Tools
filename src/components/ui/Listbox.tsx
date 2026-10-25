import { useEffect, useId, useRef, useState } from 'react'
import { CaretDownIcon, CheckIcon } from '@/components/icons'
import { Flag } from '@/components/flags'
import { cn } from '@/lib/cn'

export interface ListboxOption<T extends string> {
  value: T
  /** Shown in the trigger and the list. */
  label: string
  /**
   * ISO country code, when the option carries a flag. `EU` works — it is in
   * the flag set. Optional: plenty of lists have nothing to put here.
   */
  flag?: string
}

export interface ListboxProps<T extends string> {
  options: ReadonlyArray<ListboxOption<T>>
  value: T
  onChange: (value: T) => void
  /** Accessible name. Required — the trigger's text is the value, not a label. */
  label: string
  /**
   * Shown when `value` matches no option — the unselected state.
   *
   * Without it an unmatched value falls back to the first option, which makes
   * the control claim a choice nobody made. A form that requires this field
   * needs to be able to start empty.
   */
  placeholder?: string
  /** Matches `Select` — `center` for a form column, `start` beside a label. */
  align?: 'start' | 'center'
  /**
   * Refuses interaction, and shows it as a disabled `Input` does: the whole
   * field, caret too, at half strength, with no hover stroke (2026-10-14, for
   * the toml's RAID Standard and Asset Subclass, shown before they apply).
   */
  disabled?: boolean
  /**
   * Options shown ticked, for a list that adds and removes rather than picking
   * one — `CategoryPicker`'s sub-categories. The trigger still shows `value`.
   */
  checked?: ReadonlyArray<T>
  /** Options that cannot be picked right now: dimmed, and a press does nothing. */
  unavailable?: ReadonlyArray<T>
  className?: string
}

/**
 * The dropdown this product draws itself.
 *
 * Two reasons it exists rather than being a `Select` variant, and the second
 * is why it was renamed from `FlagSelect` on 2026-10-02:
 *
 * 1. A native `<option>` can only contain text, so an SVG flag inside one is
 *    impossible.
 * 2. A native `<option>` cannot be reliably styled. `option:checked` and
 *    `option:hover` are honoured by the CSS engine — `getComputedStyle` will
 *    even report them applied — but on macOS the open list is drawn by the
 *    operating system, which ignores all of it. A brand-coloured highlight is
 *    simply not available through a native control there.
 *
 * So this is a listbox: a different mechanism, hence a different component.
 * `Select` remains the right answer wherever the platform's own picker is
 * worth more than the styling — a filter on a phone, say.
 *
 * Keyboard is the whole cost of leaving the native control behind, so it is
 * implemented in full: Enter/Space/Arrows open, arrows move, Enter or Space
 * commits, Escape closes without committing, Home/End jump. Typing a letter
 * jumps to the next option starting with it, which is the one native
 * affordance people miss most.
 */
export function Listbox<T extends string>({
  options,
  value,
  onChange,
  label,
  placeholder,
  align = 'start',
  disabled,
  checked,
  unavailable,
  className,
}: ListboxProps<T>) {
  const [open, setOpen] = useState(false)
  // May be -1: that is the unselected state, and `placeholder` is what it
  // renders. Clamping it to 0 here was what made an empty value look like a
  // deliberate choice of the first option.
  const selectedIndex = options.findIndex((o) => o.value === value)
  /** Which option the keyboard is on. Only meaningful while open. */
  const [active, setActive] = useState(Math.max(0, selectedIndex))
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()

  const selected = options[selectedIndex]

  const isTicked = (option: ListboxOption<T>) => option.value === value || Boolean(checked?.includes(option.value))
  const isUnavailable = (option: ListboxOption<T>) => Boolean(unavailable?.includes(option.value))

  // Opens on the choice — or, in a list of ticks, on the first tick, so what
  // is picked is in view rather than somewhere down an alphabetical list.
  const openList = (startAt = Math.max(0, selectedIndex >= 0 ? selectedIndex : options.findIndex(isTicked))) => {
    setActive(startAt)
    setOpen(true)
  }

  const commit = (index: number) => {
    const option = options[index]
    // An unavailable option keeps the list open: the press was not a choice.
    if (option && isUnavailable(option)) return
    if (option) onChange(option.value)
    setOpen(false)
  }

  /** Close on an outside press or a focus leaving the control entirely. */
  useEffect(() => {
    if (!open) return
    const onDocPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open])

  /** Keep the active option in view when the arrows walk past the edge. */
  useEffect(() => {
    if (!open) return
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        openList()
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        return
      case 'Tab':
        // Let focus leave, but do not leave a menu hanging open behind it.
        setOpen(false)
        return
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => (i >= last ? 0 : i + 1))
        return
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => (i <= 0 ? last : i - 1))
        return
      case 'Home':
        e.preventDefault()
        setActive(0)
        return
      case 'End':
        e.preventDefault()
        setActive(last)
        return
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(active)
        return
    }

    // Type-ahead: one printable character jumps to the next match, wrapping,
    // so repeating a letter cycles the options that start with it.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const needle = e.key.toLowerCase()
      const order = [
        ...options.slice(active + 1),
        ...options.slice(0, active + 1),
      ]
      const hit = order.find((o) => o.label.toLowerCase().startsWith(needle))
      if (hit) {
        e.preventDefault()
        setActive(options.indexOf(hit))
      }
    }
  }

  return (
    <div ref={root} className={cn('relative inline-flex', disabled && 'opacity-50', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-(--size-control-lg) w-full cursor-pointer items-center gap-2 rounded-lg',
          // The trigger is a flex row, so `text-align` does nothing to it —
          // the flag and the label are flex items and pack to the start
          // whatever the text alignment says. Centring has to be `justify`.
          align === 'center' ? 'justify-center px-10' : 'pr-10 pl-4',
          // `bg-field`, not the `--color-track` the Figma file calls "dropdown
          // fill". The two greys are nine values apart, which beside a real
          // input does not read as a considered difference — it reads as one
          // of them being wrong. A dropdown is a field.
          // `type-body`, matching a real input's value. A dropdown shows
          // content — a country, a category — not a label, and at 600 it
          // read bolder than the field beside it holding the same kind of
          // thing.
          'bg-field text-text type-body',
          'disabled:cursor-not-allowed disabled:hover:border-surface',
          'border border-surface',
          'transition-ui hover:border-border-accent',
          // The focus ring has the field to itself. `:focus-visible` is a
          // global 2px outline held 2px off the control, and the hover border
          // is a 1px stroke hugging it — in a different red, since the two
          // come from different tokens. Both at once drew two concentric red
          // lines with a dark gap between them, which is what reads as a
          // chipped or doubled edge. Focus wins because it is the one of the
          // two that carries meaning for someone who cannot use a pointer.
          'focus-visible:border-surface',
        )}
      >
        {selected ? (
          <>
            {selected.flag && (
              <Flag code={selected.flag} decorative className="h-3 w-4.5 shrink-0 rounded-xs" />
            )}
            {/* An option valued `''` is the list's empty choice, listed so an
                answer can be taken back — it reads like the placeholder. */}
            <span className={cn('truncate', selected.value === '' && 'text-text-subtle')}>{selected.label}</span>
          </>
        ) : (
          <span className="truncate text-text-subtle">{placeholder}</span>
        )}
      </button>

      <CaretDownIcon
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-text',
          'transition-ui',
          open && 'rotate-180',
        )}
      />

      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${id}-opt-${active}`}
          className={cn(
            'absolute top-full right-0 z-50 mt-2 max-h-64 min-w-full overflow-y-auto',
            'flex flex-col gap-1 rounded-lg border border-border bg-surface-raised p-1',
            'shadow-lg',
            'animate-rise-in',
          )}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-opt-${index}`}
              role="option"
              aria-selected={isTicked(option)}
              aria-disabled={isUnavailable(option) || undefined}
              // Commit on pointer-down: the document-level close listener also
              // fires on pointerdown, and a click would arrive after it.
              onPointerDown={(e) => {
                e.preventDefault()
                commit(index)
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                'relative flex cursor-pointer items-center gap-2 rounded-md py-2 whitespace-nowrap',
                // Centred options need the tick out of the flow — left in it,
                // the label centres against the space the tick leaves rather
                // than against the row, which puts every option a few pixels
                // left of the trigger above it.
                align === 'center' ? 'justify-center px-8' : 'pr-2 pl-3',
                // Same role as the trigger, so a value does not change
                // weight at the moment it is chosen.
                'type-body transition-ui',
                // White throughout, highlighted in the brand colour. Grey
                // options under a white trigger read as a list of things
                // already unavailable, and the old highlight — a slightly
                // lighter grey — was doing the same job the brand red does
                // everywhere else on the site.
                index === active ? 'bg-accent text-text-on-accent' : 'text-text',
                isUnavailable(option) && 'cursor-not-allowed opacity-30',
              )}
            >
              {option.flag && (
                <Flag code={option.flag} decorative className="h-3 w-4.5 shrink-0 rounded-xs" />
              )}
              <span className={align === 'center' ? undefined : 'flex-1'}>{option.label}</span>
              <CheckIcon
                aria-hidden
                className={cn(
                  'size-4 shrink-0',
                  align === 'center' && 'absolute right-2',
                  // Red marks the chosen option, except on the row under the
                  // pointer — that one is already brand red, and a red tick on
                  // it disappears.
                  index === active ? 'text-text-on-accent' : 'text-accent-text',
                  isTicked(option) ? 'opacity-100' : 'opacity-0',
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
