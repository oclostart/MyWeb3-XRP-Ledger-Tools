import options from '@/assets/data/myweb3-options.json'

export interface Country {
  /** ISO 3166-1 alpha-2, upper case — also the flag's code. */
  code: string
  /** In the reader's language. */
  name: string
  /** Its calling code — `+44`. Shared by some: `+1` is the United States and two dozen more. */
  dial: string
}

/**
 * The client's country list (`src/assets/data/myweb3-options.json`,
 * supplied 2026-10-12), the one the backend's forms are built from — so the
 * directory, the tools and the server all offer the same 242 countries, each
 * with its calling code. Its placeholder row is dropped; its order leads with
 * the United States.
 */
const SOURCE = options.country.flatMap((c) =>
  c.value && c.dial_code ? [{ code: c.value, label: c.label, dial: c.dial_code }] : [],
)

/**
 * The owner's empty row, `-`: what a list shows before anything is picked.
 * Read from the file rather than typed here, so the lists say what the file
 * says.
 */
export const UNCHOSEN = options.country.find((c) => !c.value)?.label ?? '-'

const cache = new Map<string, Country[]>()

/**
 * Every country, named in `locale`, the owner's first entry first and the rest
 * in that language's alphabet.
 *
 * English reads the list's own names. Other languages take the browser's
 * `Intl.DisplayNames`, so there is no translation table to keep in step with
 * four locales — falling back to the English name for a code the browser does
 * not know.
 */
export function countriesFor(locale: string): Country[] {
  const hit = cache.get(locale)
  if (hit) return hit

  const english = locale.toLowerCase().startsWith('en')
  const names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' })
  const [first, ...rest] = SOURCE.map(({ code, label, dial }) => ({
    code,
    name: english ? label : (names.of(code) ?? label),
    dial,
  }))
  const list = [first, ...rest.sort((a, b) => a.name.localeCompare(b.name, locale))]

  cache.set(locale, list)
  return list
}
