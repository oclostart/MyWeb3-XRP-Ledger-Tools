/**
 * The two account fields Set Domain (T5) and Set EmailHash (T6) write, and the
 * `AccountSet` transaction that writes them — the real shape, which the
 * stand-in wallet stores and a real wallet will sign (T7).
 *
 * - `Domain` is the domain's lowercase ASCII as hex, at most 256 bytes. An
 *   empty `Domain` removes it.
 * - `EmailHash` is exactly 128 bits — 32 hex characters. All zeros removes it.
 *   It holds the MyWeb3 Hash, so that hash must be the same shape (OT4).
 */

import { MYWEB3_SOURCE_TAG } from './trustLines'

const DOMAIN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/

/**
 * A typed address bar's worth of input to the bare host the ledger wants:
 * `https://www.MyWeb3.me/about` becomes `myweb3.me`. `null` when no host is
 * in it. The browser's URL parser does the work, which also turns an
 * international name into the punycode ASCII the field has to hold.
 *
 * **A leading `www.` goes too** (client, 2026-10-19), as SourceTag's proposal
 * drops it — so Set Domain and Generate SourceTag read a website the same
 * way. Only when what is left is still a domain: `www.com` stays as it is,
 * and so fails.
 */
export function normaliseDomainInput(input: string): string | null {
  const raw = input.trim().toLowerCase()
  if (!raw) return null
  try {
    const host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.replace(/\.$/, '')
    const bare = host.startsWith('www.') && DOMAIN.test(host.slice(4)) ? host.slice(4) : host
    return DOMAIN.test(bare) ? bare : null
  } catch {
    return null
  }
}

export const CLEARED_EMAIL_HASH = '0'.repeat(32)

/** A MyWeb3 Hash as the ledger stores it, upper case — or `null` when it is not one. */
export function normaliseEmailHash(input: string): string | null {
  const hash = input.replace(/\s/g, '').toUpperCase()
  return /^[0-9A-F]{32}$/.test(hash) && hash !== CLEARED_EMAIL_HASH ? hash : null
}

/**
 * The two hashes the EmailHash page is shown with until MyWeb3 can answer
 * whether a hash is one of its own (C9, H7): a MyWeb3 Hash — the client's
 * Canva sample — and an ordinary email hash, the MD5 of `test@example.com`
 * that Gravatar's documentation uses. Set either to see its state.
 */
export const DEMO_MYWEB3_HASH = '98B4375E1D753E5B91627516F6D70977'
export const DEMO_STANDARD_HASH = '55502F40DC8B7C769880B10874ABC9D0'

const MYWEB3_HASHES: ReadonlySet<string> = new Set([DEMO_MYWEB3_HASH])

/**
 * Whether an EmailHash links the account to a MyWeb3 profile. **A stand-in**:
 * the one place to ask MyWeb3 instead, once it has a way to check a hash
 * (H7). Until then only the demo MyWeb3 Hash counts as one.
 */
export function isMyWeb3Hash(hash: string): boolean {
  return MYWEB3_HASHES.has(hash.toUpperCase())
}

/** What a change asks for: a value to set, or `''` to remove. */
export interface AccountChange {
  domain?: string
  emailHash?: string
}

export interface AccountSetTx {
  TransactionType: 'AccountSet'
  Account: string
  /** MyWeb3's own, on every transaction, so its activity reads on-ledger. */
  SourceTag: number
  Domain?: string
  EmailHash?: string
}

const toHex = (text: string) =>
  Array.from(new TextEncoder().encode(text), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

const fromHex = (hex: string) =>
  new TextDecoder().decode(new Uint8Array((hex.match(/../g) ?? []).map((pair) => parseInt(pair, 16))))

/** The transaction a wallet is asked to sign for a change. */
export function toAccountSetTx(account: string, change: AccountChange): AccountSetTx {
  const tx: AccountSetTx = { TransactionType: 'AccountSet', Account: account, SourceTag: MYWEB3_SOURCE_TAG }
  if (change.domain !== undefined) tx.Domain = toHex(change.domain)
  if (change.emailHash !== undefined) tx.EmailHash = change.emailHash || CLEARED_EMAIL_HASH
  return tx
}

/** An account's two fields as people read them — `''` when unset. */
export interface AccountSettings {
  domain: string
  emailHash: string
}

/** Applies a signed `AccountSet` to the fields it touches, as the ledger would. */
export function applyAccountSet(settings: AccountSettings, tx: AccountSetTx): AccountSettings {
  let emailHash = settings.emailHash
  if (tx.EmailHash !== undefined) emailHash = tx.EmailHash === CLEARED_EMAIL_HASH ? '' : tx.EmailHash
  return {
    domain: tx.Domain === undefined ? settings.domain : fromHex(tx.Domain),
    emailHash,
  }
}
