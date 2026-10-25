import { Fragment, useMemo } from 'react'
import { Field, Input, Listbox, Textarea, type ListboxOption } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { UNCHOSEN, countriesFor } from '@/lib/countries'
import { cn } from '@/lib/cn'
import { isEnabled, type FieldSpec, type Values } from '../data/toml'

export interface TomlFieldsProps {
  fields: ReadonlyArray<FieldSpec>
  values: Values
  /** Already translated, by key — a requirement not met (`checkEntry`). */
  errors?: Partial<Record<string, string>>
  /** Every field off — a token's links until it has its issuer and currency. */
  disabled?: boolean
  onChange: (key: string, value: string) => void
  /**
   * The field with the cursor, for the preview — or `null` once the cursor
   * leaves the group. `focusPrefix` tells the link sub-form's fields apart.
   */
  onFocusField: (key: string | null) => void
  focusPrefix?: string
  /** Puts the cursor in the first field — on arriving at a step, and after each Next. */
  autoFocus?: boolean
}

/** Typed values — addresses, keys, URLs — where autocorrect only does damage. */
const CODE_KEYS = new Set(['public_key', 'attestation', 'currency', 'address', 'issuer'])
const isCode = (field: FieldSpec) =>
  field.kind === 'url' || field.kind === 'email' || field.kind === 'int' || CODE_KEYS.has(field.key)

/**
 * One section's fields, laid out from its spec in `data/toml.ts` — two columns
 * from `sm`, one on a phone, and `wide` fields across both. A feature
 * composite: it only means anything inside the builder.
 *
 * Every choice is a `Listbox`, not the native `Select`, for the reason the
 * application form gives: on macOS a native list ignores the brand highlight.
 * Countries carry their flags, which only `Listbox` can show. Every list
 * comes from the client's options file (`src/assets/data/myweb3-options.json`)
 * and opens on its empty row, `-`, which stays in the list to be chosen again
 * — the way to take an answer back (client, 2026-10-12).
 *
 * No value is checked for its shape (client, 2026-10-14): people publish what
 * they write. What a section needs once it has anything — a validator's
 * public key, a token's issuer with its currency — is its `requires`
 * (client, 2026-10-19), checked on Next and shown under the field it names.
 *
 * An empty field says its own name, as the Canva draws them; a link or a
 * handle shows its shape instead (`FieldSpec.example`). No field carries a
 * line of help under it — the owner took them out (2026-10-08).
 *
 * A field that waits on another is shown at all times but disabled until it
 * applies — RAID Standard until RAID is True, Asset Subclass until there is an
 * asset class (client, 2026-10-14; it was hidden until then, rules 10 and 11).
 * A field that starts a group (`heading`) is preceded by the group's title
 * across both columns; one that is `centred` sits alone on its row, centred
 * under the fields above it at one column's width.
 */
export function TomlFields({
  fields,
  values,
  errors = {},
  disabled: allOff,
  onChange,
  onFocusField,
  focusPrefix = '',
  autoFocus,
}: TomlFieldsProps) {
  const { t, locale } = useI18n()
  // The empty row first, as every list has it, so a country can be taken back.
  const countries = useMemo<ListboxOption<string>[]>(
    () => [
      { value: '', label: UNCHOSEN },
      ...countriesFor(locale).map((c) => ({ value: c.code, label: c.name, flag: c.code })),
    ],
    [locale],
  )

  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      // Focus is read off the group rather than wired into every control, so a
      // Listbox's popup counts as its field and nothing has to forward a ref.
      onFocus={(event) => {
        const key = (event.target as HTMLElement).closest<HTMLElement>('[data-field]')?.dataset.field
        if (key) onFocusField(focusPrefix + key)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onFocusField(null)
      }}
    >
      {fields.map((field, index) => {
        const disabled = Boolean(allOff) || !isEnabled(field, values)
        const value = values[field.key] ?? ''
        const label = t(field.label)
        const placeholder = field.example ?? t(field.placeholder ?? field.label)
        const first = Boolean(autoFocus) && index === 0
        const code = isCode(field)

        let control
        if (field.kind === 'textarea') {
          control = (
            <Textarea
              rows={3}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={placeholder}
              spellCheck={!code}
              autoFocus={first}
              disabled={disabled}
            />
          )
        } else if (field.kind === 'select' || field.kind === 'country') {
          const options: ReadonlyArray<ListboxOption<string>> =
            field.kind === 'country'
              ? countries
              : (field.options ?? []).map((o) => ({ value: o.value, label: o.label ? t(o.label) : o.text }))
          control = (
            <Listbox
              options={options}
              value={value}
              onChange={(next) => onChange(field.key, next)}
              label={label}
              placeholder={UNCHOSEN}
              disabled={disabled}
              className="w-full"
            />
          )
        } else {
          control = (
            <Input
              type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'}
              inputMode={field.kind === 'int' ? 'numeric' : undefined}
              value={value}
              // A number field takes digits only — the file writes it bare,
              // and a stray letter would make the whole file unreadable.
              onChange={(e) =>
                onChange(field.key, field.kind === 'int' ? e.target.value.replace(/\D/g, '') : e.target.value)
              }
              placeholder={placeholder}
              autoComplete="off"
              autoCapitalize={code ? 'none' : undefined}
              spellCheck={!code}
              autoFocus={first}
              disabled={disabled}
            />
          )
        }

        return (
          <Fragment key={field.key}>
            {field.heading && (
              <h3 className="pt-2 text-center type-subhead text-text sm:col-span-2">{t(field.heading)}</h3>
            )}
            <div
              data-field={field.key}
              className={cn(
                field.wide && 'sm:col-span-2',
                // One column's width — half the row less half the gap.
                field.centred && 'sm:col-span-2 sm:w-[calc(50%-(--spacing(2)))] sm:justify-self-center',
              )}
            >
              <Field label={label} error={errors[field.key]}>
                {control}
              </Field>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
