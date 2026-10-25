/**
 * The stablecoins Set Trust Lines offers (H4), and the `TrustSet` that adds
 * one. Issuers and currency codes as in the client's `xrpl-transactions.ts`,
 * verified for XRPL Mainnet.
 *
 * A trust line lets an account hold a token from one issuer. Each one sets
 * aside part of the account's balance as a reserve while it exists — the
 * owner reserve, which the page reads off the ledger (`api/ledger.ts`).
 */
export const STABLECOINS = {
  RLUSD: {
    issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
    issuerName: 'Ripple',
    currency: '524C555344000000000000000000000000000000',
  },
  USDC: {
    issuer: 'rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE',
    issuerName: 'Circle',
    currency: '5553444300000000000000000000000000000000',
  },
} as const

export type Stablecoin = keyof typeof STABLECOINS

export const STABLECOIN_IDS = Object.keys(STABLECOINS) as Stablecoin[]

export const isStablecoin = (value: string): value is Stablecoin => value in STABLECOINS

/** tfSetNoRipple — recommended for a holder: nothing ripples through the account. */
const TF_SET_NO_RIPPLE = 0x00020000

/** MyWeb3's own SourceTag, from "myweb3.me" — every transaction carries it. */
export const MYWEB3_SOURCE_TAG = 2357011303

export interface TrustSetTx {
  TransactionType: 'TrustSet'
  Account: string
  SourceTag: number
  Flags: number
  LimitAmount: { currency: string; issuer: string; value: string }
}

export function toTrustSetTx(account: string, token: Stablecoin): TrustSetTx {
  const coin = STABLECOINS[token]
  return {
    TransactionType: 'TrustSet',
    Account: account,
    SourceTag: MYWEB3_SOURCE_TAG,
    Flags: TF_SET_NO_RIPPLE,
    LimitAmount: { currency: coin.currency, issuer: coin.issuer, value: '1000000000' },
  }
}

/**
 * The reserve each trust line holds, in XRP, as the ledger has set it since
 * December 2024 — shown until the ledger's own answer arrives, and if it does
 * not (`useTrustLineReserve`).
 */
export const TRUST_LINE_RESERVE_XRP = 0.2
