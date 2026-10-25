import options from '@/assets/data/myweb3-options.json'
import type { TranslationKey } from '@/lib/i18n'

/**
 * One choice in a list: the value written to the file, the client's English
 * name for it, and the key that names it in the reader's language — absent
 * where the name needs none, a number or "RAID 5".
 */
export interface FieldOption {
  value: string
  text: string
  label?: TranslationKey
}

type Row = { value: string | number | boolean | null; label: string }

/**
 * A list from the client's options file (`src/assets/data/myweb3-options.json`),
 * the one source for every dropdown in the builder. A value the file gains
 * later shows under the file's own name until it has a translation.
 *
 * Its `-` row is the empty choice, which every list opens on — and it is
 * listed, first, as the value `''` (client, 2026-10-12), so an answer can be
 * taken back: choosing `-` empties the field and takes it out of the file.
 */
function list(rows: ReadonlyArray<Row>, keys: Record<string, TranslationKey> = {}): ReadonlyArray<FieldOption> {
  return rows.map((row) =>
    row.value === null
      ? { value: '', text: row.label }
      : { value: String(row.value), text: row.label, label: keys[String(row.value)] },
  )
}

export const NETWORKS = list(options.network, {
  main: 'tools.toml.options.main',
  testnet: 'tools.toml.options.testnet',
  devnet: 'tools.toml.options.devnet',
})

/** `true` / `false`, written bare. */
export const BOOLEANS = list(options.boolean, {
  true: 'tools.toml.options.true',
  false: 'tools.toml.options.false',
})

export const RAID_STANDARDS = list(options.raid_standard, { other: 'tools.toml.options.other' })

/** 0 to 15: the ledger shows fifteen significant digits, so more would be noise. */
export const DISPLAY_DECIMALS = list(options.display_decimals)

export const ASSET_CLASSES = list(options.asset_class, {
  rwa: 'tools.toml.options.rwa',
  memes: 'tools.toml.options.memes',
  wrapped: 'tools.toml.options.wrapped',
  gaming: 'tools.toml.options.gaming',
  defi: 'tools.toml.options.defi',
  other: 'tools.toml.options.other',
})

export const ASSET_SUBCLASSES = list(options.asset_subclass, {
  stablecoin: 'tools.toml.options.stablecoin',
  commodity: 'tools.toml.options.commodity',
  real_estate: 'tools.toml.options.realEstate',
  private_credit: 'tools.toml.options.privateCredit',
  equity: 'tools.toml.options.equity',
  treasury: 'tools.toml.options.treasury',
  other: 'tools.toml.options.other',
})

export const URL_TYPES = list(options.url_type, {
  website: 'tools.toml.options.website',
  social: 'tools.toml.options.social',
  document: 'tools.toml.options.document',
})
