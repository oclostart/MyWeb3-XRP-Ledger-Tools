import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import options from '@/assets/data/myweb3-options.json'
import { en, type Dictionary } from './locales/en'
import { ko } from './locales/ko'
import { ja } from './locales/ja'
import { es } from './locales/es'
import { zh } from './locales/zh'

const DICTIONARIES = { en, ko, ja, es, zh } as const

export type Locale = keyof typeof DICTIONARIES

/** The options file's language codes, to the dictionaries that carry them. */
const BY_CODE: Record<string, Locale> = { en: 'en', ko: 'ko', ja: 'ja', 'es-MX': 'es', 'zh-CN': 'zh' }

/** A flag emoji's two regional letters, as the country code the flag set uses: 🇰🇷 → KR. */
const flagCode = (emoji: string) =>
  Array.from(emoji, (c) => String.fromCharCode((c.codePointAt(0) ?? 0) - 0x1f1e6 + 65)).join('')

/**
 * The supported languages, in the order they are offered — the client's
 * options file (`src/assets/data/myweb3-options.json`) decides the order, the
 * names and the flags (2026-10-12): English, 한국어, 日本語, Español,
 * 简体中文.
 *
 * Each is labelled in its own language — someone looking for Chinese scans for
 * 简体中文, not "Chinese". `flag` is the country whose flag stands for the
 * language, which is a convention rather than a fact: English is not the
 * United States. It earns its place because a flag is recognisable at a glance
 * in a way a language name in an unfamiliar script is not.
 */
export const LOCALES = Object.fromEntries(
  options.language.flatMap((language) => {
    const locale = BY_CODE[language.value]
    return locale ? [[locale, { label: language.label, flag: flagCode(language.flag), dict: DICTIONARIES[locale] }]] : []
  }),
) as Record<Locale, { label: string; flag: string; dict: Dictionary }>

/** Dotted paths into the dictionary — 'merchant.explore', not a loose string. */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TranslationKey = Leaves<Dictionary>

const STORAGE_KEY = 'mw3.locale'

function readStored(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved && saved in LOCALES ? (saved as Locale) : 'en'
}

function lookup(dict: Dictionary, key: string): string {
  const value = key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    dict,
  )
  // Typed keys make this unreachable in app code; it only trips if a key is
  // read from data at runtime. Surface the key rather than rendering nothing.
  return typeof value === 'string' ? value : key
}

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStored)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  const t = useCallback<I18nValue['t']>(
    (key, vars) => {
      const raw = lookup(LOCALES[locale].dict, key)
      if (!vars) return raw
      return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`))
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Shorthand for the common case. */
export function useT() {
  return useI18n().t
}

/**
 * `t`, but the slots can be React nodes.
 *
 * Exists because some sentences need part of themselves styled — a term in the
 * brand green, a nav path in bold — and `t` can only return a string. The
 * alternative is assembling the sentence from fragments at the call site,
 * which hard-codes English word order: Japanese puts the same term somewhere
 * else entirely, and the fragments would read as nonsense there.
 *
 * Returns an array, so it goes straight into JSX. A slot with no value is left
 * as its own `{name}`, which makes a missing one visible rather than silent.
 */
export function useRichT() {
  const { locale } = useI18n()
  return useCallback(
    (key: TranslationKey, slots: Record<string, ReactNode>): ReactNode[] => {
      const raw = lookup(LOCALES[locale].dict, key)
      return raw.split(/(\{\w+\})/g).map((part, i) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1]
        if (!name) return part
        return <Fragment key={i}>{slots[name] ?? part}</Fragment>
      })
    },
    [locale],
  )
}
