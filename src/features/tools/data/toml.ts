import type { TranslationKey } from '@/lib/i18n'
import {
  ASSET_CLASSES,
  ASSET_SUBCLASSES,
  BOOLEANS,
  DISPLAY_DECIMALS,
  NETWORKS,
  RAID_STANDARDS,
  URL_TYPES,
  type FieldOption,
} from './options'

export type { FieldOption } from './options'

/**
 * The xrp-ledger.toml builder's model (T4): which sections exist, which fields
 * each holds, and how a filled-in form becomes the file.
 *
 * Every key is a published one. `[METADATA]`, `[[PRINCIPALS]]`,
 * `[[VALIDATORS]]`, `[[ACCOUNTS]]` and `[[SERVERS]]` are the xrpl.org
 * reference; `[[ISSUERS]]`, `[[TOKENS]]` and `[[TOKENS.URLS]]` are XLS-26; the
 * validator's `server_location`, `server_cloud` and `network_asn` are XLS-50.
 * Three keys stretch a spec rather than quote it, each following its pattern:
 * `myweb3` on a principal is a social handle named by its site, which is how
 * the reference says to add one (`x = "@username"`); `desc` on a validator or
 * a server is the description key the other sections already use; and
 * `network` / `display_decimals` on a token are `[[CURRENCIES]]`' own.
 *
 * `[ORGANIZATION]` is the one table no spec defines. The Canva opens with it
 * and the owner asked for it (2026-10-07, OT1), so it is built as drawn: one
 * table, filled once, with keys in the principals' pattern — `name`, a
 * `website`, and social handles named by their site. A reader that does not
 * know the table passes over it, as TOML readers do.
 *
 * The validator's "Server Specifications" hardware block — model, cpu,
 * memory, storage, raid, raid_standard, network_card, operating_system,
 * internet_connectivity — is in no spec either. Its keys are the client's
 * template (`docs/client/xrp-ledger-template.toml`, 2026-10-12), which closed
 * OT5; so is every rule of the export (`docs/client/xrp-ledger-toml-rules.md`).
 */

export type SectionId = 'principals' | 'validators' | 'accounts' | 'servers' | 'issuers' | 'tokens'

/** How a field is edited. */
export type FieldKind = 'text' | 'textarea' | 'email' | 'url' | 'int' | 'select' | 'country'

/** How a value is written. Strings are quoted; the rest are bare. */
export type TomlType = 'string' | 'integer' | 'boolean' | 'datetime'

export interface FieldSpec {
  key: string
  label: TranslationKey
  kind: FieldKind
  toml?: TomlType
  /**
   * What the empty field shows. By default its own name, as the Canva draws
   * every input — "Name" in Name, "Description" in Description. A field can
   * show a sample instead (`example`, as written in every language): a link's
   * or a handle's shape, an address's `r...`, a key's `n...`, a server part
   * such as `Dell R650` (client, 2026-10-19). Or a shorter name of its own
   * (`placeholder`, translated) — Server Location's "Location".
   */
  example?: string
  placeholder?: TranslationKey
  options?: ReadonlyArray<FieldOption>
  /**
   * Disabled, and kept out of the file, until another field holds `equals` —
   * or, with no `equals`, any value at all. The client's rules 10 and 11:
   * `raid_standard` only when `raid` is true, `asset_subclass` only when an
   * asset class is set. Shown all the while, disabled (client, 2026-10-14);
   * it was hidden until it applied.
   */
  enabledWhen?: { key: string; equals?: string }
  /** Starts a titled group of fields — the validator's Server Specifications. */
  heading?: TranslationKey
  /** Takes both columns. */
  wide?: boolean
  /**
   * Alone on its row, centred at one column's width — a lone half-width field
   * after wide ones, as Accounts' Network (client, 2026-10-14).
   */
  centred?: boolean
}

/** Stands for a token's links in a requirement's `when`: its `[[TOKENS.URLS]]`. */
export const LINKS = '@links'

/**
 * What an entry must hold once it holds something else (client, 2026-10-19).
 * Nothing is required of an empty entry, and no value is checked for its
 * shape — only for being there.
 *
 * - `field` is required once any of `when` is filled — once anything else
 *   is, for `'any'`.
 * - At least one of `oneOf` is, once any of `when` is filled.
 */
export type Requirement =
  | { field: string; when: ReadonlyArray<string> | 'any' }
  | { oneOf: ReadonlyArray<string>; when: ReadonlyArray<string> }

/** What a requirement that is not met says, under the field it names. */
export type FieldError = 'required' | 'oneOf'

export interface SectionSpec {
  id: SectionId
  table: string
  step: TranslationKey
  intro: TranslationKey
  fields: ReadonlyArray<FieldSpec>
  requires?: ReadonlyArray<Requirement>
}

/**
 * `[ORGANIZATION]` — the Canva's first step: who publishes the file. A single
 * table rather than an array, since "ORGANIZATION can only be added once".
 */
export const ORGANIZATION_FIELDS: ReadonlyArray<FieldSpec> = [
  { key: 'name', label: 'tools.toml.fields.name', kind: 'text' },
  { key: 'website', label: 'tools.toml.fields.website', kind: 'url', example: 'https://example.com' },
  { key: 'myweb3', label: 'tools.toml.fields.myweb3', kind: 'text', example: '@username' },
  { key: 'x', label: 'tools.toml.fields.x', kind: 'text', example: '@username' },
]

/** The prefix a field of the organization step carries as the preview's focus. */
export const ORG_FOCUS = 'org.'

export const SECTIONS: ReadonlyArray<SectionSpec> = [
  {
    id: 'principals',
    table: 'PRINCIPALS',
    step: 'tools.toml.sections.principals.step',
    intro: 'tools.toml.sections.principals.intro',
    fields: [
      { key: 'name', label: 'tools.toml.fields.name', kind: 'text' },
      { key: 'email', label: 'tools.toml.fields.email', kind: 'email' },
      { key: 'myweb3', label: 'tools.toml.fields.myweb3', kind: 'text', example: '@username' },
      { key: 'x', label: 'tools.toml.fields.x', kind: 'text', example: '@username' },
    ],
  },
  {
    id: 'validators',
    table: 'VALIDATORS',
    step: 'tools.toml.sections.validators.step',
    intro: 'tools.toml.sections.validators.intro',
    fields: [
      { key: 'public_key', label: 'tools.toml.fields.publicKey', kind: 'text', wide: true, example: 'n...' },
      { key: 'attestation', label: 'tools.toml.fields.attestation', kind: 'textarea', wide: true },
      { key: 'network', label: 'tools.toml.fields.network', kind: 'select', options: NETWORKS },
      { key: 'owner_country', label: 'tools.toml.fields.ownerCountry', kind: 'country' },
      { key: 'server_country', label: 'tools.toml.fields.serverCountry', kind: 'country' },
      { key: 'server_location', label: 'tools.toml.fields.serverLocation', kind: 'text', placeholder: 'tools.toml.placeholders.location' },
      { key: 'server_cloud', label: 'tools.toml.fields.serverCloud', kind: 'select', toml: 'boolean', options: BOOLEANS },
      { key: 'network_asn', label: 'tools.toml.fields.networkAsn', kind: 'int', toml: 'integer', example: 'ASN' },
      { key: 'desc', label: 'tools.toml.fields.desc', kind: 'textarea', wide: true },
      { key: 'unl', label: 'tools.toml.fields.unl', kind: 'url', wide: true, example: 'https://example.com' },
      { key: 'model', label: 'tools.toml.fields.model', kind: 'text', heading: 'tools.toml.fields.serverSpecs', example: 'Dell R650' },
      { key: 'cpu', label: 'tools.toml.fields.cpu', kind: 'text', example: '64 AMD Ryzen 9 7950X' },
      { key: 'memory', label: 'tools.toml.fields.memory', kind: 'text', example: '64 GB' },
      { key: 'storage', label: 'tools.toml.fields.storage', kind: 'text', example: '1.92 TB Samsung PM9A3 NVMe' },
      { key: 'raid', label: 'tools.toml.fields.raid', kind: 'select', toml: 'boolean', options: BOOLEANS },
      {
        key: 'raid_standard',
        label: 'tools.toml.fields.raidStandard',
        kind: 'select',
        options: RAID_STANDARDS,
        enabledWhen: { key: 'raid', equals: 'true' },
      },
      { key: 'network_card', label: 'tools.toml.fields.networkCard', kind: 'text', example: 'FM487 1350' },
      { key: 'operating_system', label: 'tools.toml.fields.operatingSystem', kind: 'text', example: 'Linux Ubuntu' },
      { key: 'internet_connectivity', label: 'tools.toml.fields.internetConnectivity', kind: 'text', wide: true, example: '1 Gbps' },
    ],
    // A validator is its public key: anything else about one needs it.
    requires: [{ field: 'public_key', when: 'any' }],
  },
  {
    id: 'accounts',
    table: 'ACCOUNTS',
    step: 'tools.toml.sections.accounts.step',
    intro: 'tools.toml.sections.accounts.intro',
    fields: [
      { key: 'address', label: 'tools.toml.fields.address', kind: 'text', wide: true, example: 'r...' },
      { key: 'desc', label: 'tools.toml.fields.desc', kind: 'textarea', wide: true },
      { key: 'network', label: 'tools.toml.fields.network', kind: 'select', options: NETWORKS, centred: true },
    ],
    requires: [{ field: 'address', when: ['desc', 'network'] }],
  },
  {
    id: 'servers',
    table: 'SERVERS',
    step: 'tools.toml.sections.servers.step',
    intro: 'tools.toml.sections.servers.intro',
    fields: [
      { key: 'json_rpc', label: 'tools.toml.fields.jsonRpc', kind: 'url', example: 'https://example.com:51234' },
      { key: 'peer', label: 'tools.toml.fields.peer', kind: 'url', example: 'https://example.com:51235' },
      { key: 'ws', label: 'tools.toml.fields.ws', kind: 'url', example: 'wss://example.com' },
      { key: 'network', label: 'tools.toml.fields.network', kind: 'select', options: NETWORKS },
      { key: 'desc', label: 'tools.toml.fields.desc', kind: 'textarea', wide: true },
    ],
    // A server is where it answers: a network or a description needs one.
    requires: [{ oneOf: ['json_rpc', 'ws', 'peer'], when: ['network', 'desc'] }],
  },
  {
    id: 'issuers',
    table: 'ISSUERS',
    step: 'tools.toml.sections.issuers.step',
    intro: 'tools.toml.sections.issuers.intro',
    fields: [
      { key: 'address', label: 'tools.toml.fields.address', kind: 'text', wide: true, example: 'r...' },
      { key: 'name', label: 'tools.toml.fields.name', kind: 'text', wide: true },
      { key: 'desc', label: 'tools.toml.fields.desc', kind: 'textarea', wide: true },
      { key: 'icon', label: 'tools.toml.fields.icon', kind: 'url', wide: true, example: 'https://example.com/icon.png' },
    ],
    requires: [{ field: 'address', when: ['name', 'desc', 'icon'] }],
  },
  {
    id: 'tokens',
    table: 'TOKENS',
    step: 'tools.toml.sections.tokens.step',
    intro: 'tools.toml.sections.tokens.intro',
    fields: [
      { key: 'issuer', label: 'tools.toml.fields.issuer', kind: 'text', wide: true, example: 'r...' },
      { key: 'currency', label: 'tools.toml.fields.currency', kind: 'text' },
      { key: 'name', label: 'tools.toml.fields.name', kind: 'text' },
      { key: 'network', label: 'tools.toml.fields.network', kind: 'select', options: NETWORKS },
      { key: 'display_decimals', label: 'tools.toml.fields.displayDecimals', kind: 'select', toml: 'integer', options: DISPLAY_DECIMALS },
      { key: 'icon', label: 'tools.toml.fields.icon', kind: 'url', wide: true, example: 'https://example.com/icon.png' },
      { key: 'desc', label: 'tools.toml.fields.desc', kind: 'textarea', wide: true },
      { key: 'asset_class', label: 'tools.toml.fields.assetClass', kind: 'select', options: ASSET_CLASSES },
      {
        key: 'asset_subclass',
        label: 'tools.toml.fields.assetSubclass',
        kind: 'select',
        options: ASSET_SUBCLASSES,
        enabledWhen: { key: 'asset_class' },
      },
    ],
    // A token is its issuer and its currency, together; its links need both.
    requires: [
      { field: 'currency', when: ['issuer', LINKS] },
      { field: 'issuer', when: ['currency', LINKS] },
    ],
  },
]

/** `[[TOKENS.URLS]]` — XLS-26's links, each belonging to the token above it. */
export const URL_FIELDS: ReadonlyArray<FieldSpec> = [
  { key: 'url', label: 'tools.toml.fields.url', kind: 'url', wide: true, example: 'https://example.com' },
  {
    key: 'type',
    label: 'tools.toml.fields.type',
    kind: 'select',
    options: URL_TYPES,
  },
  { key: 'title', label: 'tools.toml.fields.title', kind: 'text' },
]

/** The field the Expiration Date step edits — `[METADATA]`'s `expires`. */
export const EXPIRES_KEY = 'expires'

// ── State ────────────────────────────────────────────────────────────────

export type Values = Record<string, string>

export interface Entry {
  values: Values
  /** Only a token has these. */
  urls: Values[]
}

export interface TomlState {
  /** Bumped when the shape changes, so a saved draft is migrated or dropped rather than misread. */
  v: 2
  step: number
  /** `[ORGANIZATION]` — one table, so one set of values rather than entries. */
  organization: Values
  entries: Record<SectionId, Entry[]>
  drafts: Record<SectionId, Entry>
  /**
   * The saved entry open in the current step, by index — absent while the
   * step shows its fresh form. Back opens a section's first entry rather than
   * a blank form, and Next walks on through the rest (owner, 2026-10-08).
   */
  cursor?: number
  /** The `[[TOKENS.URLS]]` sub-form, before Add. */
  urlDraft: Values
  /** `YYYY-MM-DD`, from the date field. */
  expires: string
}

export const emptyEntry = (): Entry => ({ values: {}, urls: [] })

const bySection = <T,>(make: () => T) =>
  Object.fromEntries(SECTIONS.map((s) => [s.id, make()])) as Record<SectionId, T>

export const initialState = (): TomlState => ({
  v: 2,
  step: 0,
  organization: {},
  entries: bySection<Entry[]>(() => []),
  drafts: bySection(emptyEntry),
  urlDraft: {},
  expires: '',
})

const filled = (value: string | undefined) => Boolean(value && value.trim())

export const isBlank = (values: Values) => !Object.values(values).some(filled)

export const isEntryBlank = (entry: Entry, urlDraft: Values = {}) =>
  isBlank(entry.values) && entry.urls.length === 0 && isBlank(urlDraft)

/** Whether a field is shown — see `FieldSpec.enabledWhen`. */
export const isEnabled = (field: FieldSpec, values: Values) => {
  const when = field.enabledWhen
  if (!when) return true
  return when.equals === undefined ? filled(values[when.key]) : values[when.key] === when.equals
}

/**
 * A token's links open once it has both its issuer and its currency (client,
 * 2026-10-19): a link belongs to a token, and a token is those two.
 */
export const linksEnabled = (values: Values) => filled(values.issuer) && filled(values.currency)

/**
 * The requirements an entry does not meet, each under the field it names — or
 * `null` when it meets them all. `links` is whether it has any links, for a
 * token's `LINKS`. An `oneOf` names its first field.
 */
export function checkEntry(section: SectionSpec, values: Values, links = false): Record<string, FieldError> | null {
  const has = (key: string) => (key === LINKS ? links : filled(values[key]))
  const errors: Record<string, FieldError> = {}
  for (const rule of section.requires ?? []) {
    if ('field' in rule) {
      const when = rule.when === 'any' ? section.fields.map((f) => f.key).filter((key) => key !== rule.field) : rule.when
      if (!has(rule.field) && when.some(has)) errors[rule.field] = 'required'
    } else if (rule.when.some(has) && !rule.oneOf.some(has)) {
      errors[rule.oneOf[0]] = 'oneOf'
    }
  }
  return Object.keys(errors).length ? errors : null
}

/**
 * The client's rule 9: `expires` must be later than `modified`, which is the
 * moment of the download. A date is read as its first instant in UTC, as it
 * is written, so today is already too early.
 */
export const expiresInFuture = (expires: string, now: Date) =>
  !expires || new Date(`${expires}T00:00:00.000Z`).getTime() > now.getTime()

// ── Writing the file ─────────────────────────────────────────────────────

/** What each piece of a line is, so a preview can colour it without parsing. */
export type Role = 'table' | 'key' | 'punct' | 'string' | 'literal'
export type Part = { role: Role; text: string }
export type Line = Part[]

const ESCAPES: Record<string, string> = {
  '\\': '\\\\',
  '"': '\\"',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
}

/** A TOML basic string: quotes, backslashes and control characters escaped. */
function basicString(value: string): string {
  const body = value.replace(
    // eslint-disable-next-line no-control-regex
    /[\\"\u0000-\u001f\u007f]/g,
    (c) => ESCAPES[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`,
  )
  return `"${body}"`
}

/**
 * One `key = value` line. A `null` value is the field with the cursor in it,
 * still empty: shown so someone can see where their typing will land — `""`
 * for a string, nothing at all for a number or a yes/no, as the Canva asks.
 */
function pair(key: string, value: string | null, type: TomlType): Line {
  const head: Line = [
    { role: 'key', text: key },
    { role: 'punct', text: ' = ' },
  ]
  if (value === null) return type === 'string' ? [...head, { role: 'string', text: '""' }] : head
  if (type === 'string') return [...head, { role: 'string', text: basicString(value) }]
  return [...head, { role: 'literal', text: value }]
}

const table = (name: string, array: boolean): Line => [
  { role: 'table', text: array ? `[[${name}]]` : `[${name}]` },
]

export interface BuildOptions {
  /** `modified` — the moment of the preview, or of the download. */
  now: Date
  /** The step's fresh entry in progress, written after the ones already added. */
  draft?: { section: SectionId; entry: Entry; urlDraft: Values }
  /** A saved entry open in the form instead, edited where it stands. */
  editing?: { section: SectionId; index: number; urlDraft: Values }
  /**
   * The field with the cursor. `url.<key>` for the link sub-form, `org.<key>`
   * for the organization, `expires` for the date.
   */
  focus?: string | null
}

export interface Built {
  lines: Line[]
  /** Where the part being written starts — the line a preview keeps in view. */
  activeLine?: number
}

/**
 * The file as lines of parts. `[METADATA]` first, then `[ORGANIZATION]` — who
 * the file is from, before what they run — then the sections in the
 * reference's order, each `[[TOKENS.URLS]]` directly after its own
 * `[[TOKENS]]`, which XLS-26 requires.
 */
export function buildToml(state: TomlState, { now, draft, editing, focus = null }: BuildOptions): Built {
  const lines: Line[] = []
  let activeLine: number | undefined

  lines.push(table('METADATA', false))
  lines.push(pair('modified', now.toISOString(), 'datetime'))
  if (filled(state.expires)) {
    if (focus === EXPIRES_KEY) activeLine = lines.length
    lines.push(pair(EXPIRES_KEY, `${state.expires}T00:00:00.000Z`, 'datetime'))
  } else if (focus === EXPIRES_KEY) {
    activeLine = lines.length
    lines.push(pair(EXPIRES_KEY, null, 'datetime'))
  }

  const writePairs = (fields: ReadonlyArray<FieldSpec>, values: Values, focusKey: string | null) => {
    for (const field of fields) {
      const type = field.toml ?? 'string'
      if (filled(values[field.key])) lines.push(pair(field.key, values[field.key].trim(), type))
      else if (focusKey === field.key) lines.push(pair(field.key, null, type))
    }
  }

  const hasPairs = (fields: ReadonlyArray<FieldSpec>, values: Values, focusKey: string | null) =>
    fields.some((f) => filled(values[f.key]) || focusKey === f.key)

  const orgFocus = focus?.startsWith(ORG_FOCUS) ? focus.slice(ORG_FOCUS.length) : null
  if (hasPairs(ORGANIZATION_FIELDS, state.organization, orgFocus)) {
    lines.push([])
    if (orgFocus) activeLine = lines.length
    lines.push(table('ORGANIZATION', false))
    writePairs(ORGANIZATION_FIELDS, state.organization, orgFocus)
  }

  for (const section of SECTIONS) {
    const writing = draft?.section === section.id ? draft : undefined
    const entries = writing ? [...state.entries[section.id], writing.entry] : state.entries[section.id]
    // The entry in the form — the fresh one at the end, or a saved one opened
    // where it stands — is the one whose empty field shows and whose lines
    // the preview keeps in view.
    const openIndex = writing ? entries.length - 1 : editing?.section === section.id ? editing.index : -1
    const urlDraft = writing?.urlDraft ?? (openIndex >= 0 && editing ? editing.urlDraft : {})

    entries.forEach((entry, index) => {
      const isOpen = index === openIndex
      const fieldFocus = isOpen && focus && !focus.startsWith('url.') ? focus : null
      const urlFocus = isOpen && focus?.startsWith('url.') ? focus.slice(4) : null
      const urls = isOpen && hasPairs(URL_FIELDS, urlDraft, urlFocus) ? [...entry.urls, urlDraft] : entry.urls

      if (!hasPairs(section.fields, entry.values, fieldFocus) && urls.length === 0 && !urlFocus) return

      lines.push([])
      if (isOpen) activeLine = lines.length
      lines.push(table(section.table, true))
      writePairs(section.fields, entry.values, fieldFocus)

      urls.forEach((url, u) => {
        const isUrlDraft = isOpen && u === urls.length - 1 && url === urlDraft
        lines.push([])
        if (isUrlDraft) activeLine = lines.length
        lines.push(table(`${section.table}.URLS`, true))
        writePairs(URL_FIELDS, url, isUrlDraft ? urlFocus : null)
      })
    })
  }

  return { lines, activeLine }
}

/** The lines as the file's text, ending in a newline as text files do. */
export const toText = (lines: ReadonlyArray<Line>) =>
  lines.map((line) => line.map((part) => part.text).join('')).join('\n') + '\n'

// ── Keeping work across a reload ─────────────────────────────────────────

const STORAGE_KEY = 'mw3.tools.xrpLedgerToml'

/**
 * Nine steps is long enough to lose to a stray reload, so the work is kept in
 * this browser until Reset. Read defensively: storage can be blocked, cleared
 * or left over from an older shape, and any of those starts the builder fresh.
 */
export function loadState(): TomlState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const saved = JSON.parse(raw) as Omit<Partial<TomlState>, 'v'> & { v?: number }
    if (!saved?.entries || !saved.drafts) return initialState()
    // Version 1 had no organization step. Its work carries over, one step
    // further along, since the new step was put in front of all the others.
    if (saved.v === 1) return { ...initialState(), ...saved, v: 2, organization: {}, step: (saved.step ?? 0) + 1 }
    if (saved.v !== 2) return initialState()
    return { ...initialState(), ...saved } as TomlState
  } catch {
    return initialState()
  }
}

/** Reset needs nothing of its own: it saves a fresh state over the old one. */
export function saveState(state: TomlState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Blocked or full. The builder still works; it just will not survive a reload.
  }
}
