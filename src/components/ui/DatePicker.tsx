import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarIcon, ChevronLeftIcon } from '@/components/icons'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/cn'

export interface DatePickerProps {
  /** The date as `YYYY-MM-DD`, or `''` when none is chosen. */
  value: string
  onChange: (value: string) => void
  /** The earliest date that can be chosen, `YYYY-MM-DD`; earlier days are shown but off. */
  min?: string
  /** Read in the field while it is empty, in the placeholder grey. */
  placeholder: string
  /** The accessible name, when no `Field` label names it. */
  label?: string
  /** From `Field`: the label's `for`. */
  id?: string
  /** From `Field`: an error under the field. */
  invalid?: boolean
  required?: boolean
  autoFocus?: boolean
  className?: string
}

/** Calendar arithmetic in UTC, so a date never slips a day across a time zone. */
const toDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10)
const DAY = 86_400_000

/** The locale's first day of the week, 1 Monday … 7 Sunday — Sunday where the browser cannot say. */
function firstDayOf(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    return loc.getWeekInfo?.().firstDay ?? loc.weekInfo?.firstDay ?? 7
  } catch {
    return 7
  }
}

/**
 * A date, chosen from a calendar in the system's own look (client,
 * 2026-10-13: "can the calendar look improve?"). The browser's date input
 * opened the operating system's picker, which no page can style, and showed
 * its "dd/mm/yyyy" in the white of a value.
 *
 * **The field is the language menu's**: field grey, the same stroke and brand
 * red under the pointer, the date in the reader's language ("October 25,
 * 2026") or the placeholder in grey, and `CalendarIcon` where a dropdown has
 * its caret. **The calendar is its list's panel** — raised surface, 8px
 * corners, rising in — holding the month with a chevron either side, the
 * weekdays in small grey capitals, and the days on a 36 grid: the brand plate
 * under the chosen day, the field grey under the pointer, today ringed, and
 * days before `min` shown but off.
 *
 * Keys, as a calendar takes them: arrows move a day or a week, Page Up and
 * Down a month, Home and End the week's ends, Enter or Space choose, Escape
 * closes and gives the field its focus back. **Backspace or Delete clears the
 * date** — on the field, or in the open calendar (client, 2026-10-14: there
 * was no way to take a chosen date back). It closes on an outside press or
 * focus leaving, as every layer in the system does. The week starts where the
 * reader's locale starts it.
 */
export function DatePicker({
  value,
  onChange,
  min,
  placeholder,
  label,
  id,
  invalid,
  required,
  autoFocus,
  className,
}: DatePickerProps) {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const today = toIso(Date.now() - new Date().getTimezoneOffset() * 60_000)
  // The day with the keyboard's focus; its month is the one shown.
  const [active, setActive] = useState(() => value || (min && min > today ? min : today))
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const grid = useRef<HTMLDivElement>(null)

  const formats = useMemo(
    () => ({
      value: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }),
      month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }),
      full: new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }),
    }),
    [locale],
  )
  const firstDay = useMemo(() => firstDayOf(locale), [locale])

  const view = new Date(toDay(active))
  const year = view.getUTCFullYear()
  const month = view.getUTCMonth()
  const monthStart = Date.UTC(year, month, 1)
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  // Blank cells before the 1st: how far its weekday sits past the week's first.
  const lead = (new Date(monthStart).getUTCDay() - (firstDay % 7) + 7) % 7
  // 2023-01-01 was a Sunday; the week's seven names from the locale's first day.
  const weekdays = Array.from({ length: 7 }, (_, i) => formats.weekday.format(Date.UTC(2023, 0, 1 + ((firstDay % 7) + i))))

  const isOff = (iso: string) => Boolean(min && iso < min)
  const prevMonthEnd = toIso(monthStart - DAY)
  const canGoBack = !min || prevMonthEnd >= min

  const show = () => {
    setActive(value || (min && min > today ? min : today))
    setOpen(true)
  }

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }

  const clear = () => {
    if (!value) return
    onChange('')
    close(true)
  }

  const choose = (iso: string) => {
    if (isOff(iso)) return
    onChange(iso)
    close(true)
  }

  // The day with the keyboard's focus takes it as the calendar opens and as
  // it moves.
  useEffect(() => {
    if (!open) return
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${active}"]`)?.focus()
  }, [open, active])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open])

  const shiftMonth = (by: number) => {
    const d = new Date(toDay(active))
    const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + by, 1)
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + by + 1, 0)).getUTCDate()
    setActive(toIso(Date.UTC(new Date(target).getUTCFullYear(), new Date(target).getUTCMonth(), Math.min(d.getUTCDate(), last))))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = toDay(active)
    const weekday = (new Date(t).getUTCDay() - (firstDay % 7) + 7) % 7
    const moves: Record<string, () => void> = {
      Backspace: () => clear(),
      Delete: () => clear(),
      ArrowLeft: () => setActive(toIso(t - DAY)),
      ArrowRight: () => setActive(toIso(t + DAY)),
      ArrowUp: () => setActive(toIso(t - 7 * DAY)),
      ArrowDown: () => setActive(toIso(t + 7 * DAY)),
      Home: () => setActive(toIso(t - weekday * DAY)),
      End: () => setActive(toIso(t + (6 - weekday) * DAY)),
      PageUp: () => shiftMonth(-1),
      PageDown: () => shiftMonth(1),
      Escape: () => close(true),
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    move()
  }

  return (
    <div ref={root} className={cn('relative w-full', className)}>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        autoFocus={autoFocus}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if ((e.key === 'Backspace' || e.key === 'Delete') && value) {
            e.preventDefault()
            clear()
          }
        }}
        aria-keyshortcuts={value ? 'Backspace Delete' : undefined}
        className={cn(
          'flex h-(--size-control-lg) w-full cursor-pointer items-center rounded-lg pr-10 pl-4 text-left',
          'border border-surface bg-field type-body transition-ui hover:border-border-accent focus-visible:border-surface',
          invalid && 'border-critical',
          value ? 'text-text' : 'text-text-subtle',
        )}
      >
        <span className="truncate">{value ? formats.value.format(toDay(value)) : placeholder}</span>
      </button>
      <CalendarIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-text"
      />

      {open && (
        <div
          role="dialog"
          aria-label={formats.month.format(monthStart)}
          className={cn(
            'absolute top-full left-0 z-50 mt-2 flex w-max flex-col gap-2 p-3',
            'rounded-lg border border-border bg-surface-raised shadow-lg animate-rise-in',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={!canGoBack}
              aria-label={t('common.previousMonth')}
              className={cn(
                'flex size-9 cursor-pointer items-center justify-center rounded-md text-text transition-ui',
                'hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30 [&_svg]:size-4',
              )}
            >
              <ChevronLeftIcon />
            </button>
            <p aria-live="polite" className="type-label text-text">
              {formats.month.format(monthStart)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t('common.nextMonth')}
              className={cn(
                'flex size-9 cursor-pointer items-center justify-center rounded-md text-text transition-ui',
                'hover:bg-surface-hover [&_svg]:size-4',
              )}
            >
              <ChevronLeftIcon className="rotate-180" />
            </button>
          </div>

          <div aria-hidden className="grid grid-cols-7 gap-1">
            {weekdays.map((name, i) => (
              <span key={i} className="flex size-9 items-center justify-center type-micro text-text-subtle uppercase">
                {name}
              </span>
            ))}
          </div>

          <div ref={grid} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-1">
            {Array.from({ length: lead }, (_, i) => (
              <span key={`lead-${i}`} aria-hidden className="size-9" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const iso = toIso(Date.UTC(year, month, i + 1))
              const chosen = iso === value
              const off = isOff(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  data-day={iso}
                  tabIndex={iso === active ? 0 : -1}
                  aria-label={formats.full.format(toDay(iso))}
                  aria-pressed={chosen}
                  aria-disabled={off || undefined}
                  onClick={() => choose(iso)}
                  onFocus={() => setActive(iso)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md type-body tabular-nums transition-ui',
                    off
                      ? 'cursor-not-allowed text-text-subtle opacity-40'
                      : chosen
                        ? 'cursor-pointer bg-accent text-text-on-accent'
                        : 'cursor-pointer text-text hover:bg-surface-hover',
                    iso === today && !chosen && 'ring-1 ring-border-strong ring-inset',
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
