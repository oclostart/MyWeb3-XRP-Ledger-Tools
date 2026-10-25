/**
 * The client's transaction helpers, as supplied (docs/client/xrpl-transactions.ts,
 * 2026-10-12), used by /api/sign. One change, the client's decision A of
 * 2026-10-12: `generateSourceTag` also strips a leading "www.", as the
 * Deterministic SourceTag proposal does — so myweb3.me and www.myweb3.me both
 * give 2357011303. `normalizeDomain` itself keeps "www.", because the Domain
 * field stores the host as given.
 *
 * MyWeb3.me XRP Ledger Tools: transaction helpers
 *
 * - SourceTag: deterministic tag from a domain (SHA-256, first 4 bytes → number)
 * - Set / Remove EmailHash  (AccountSet)
 * - Set / Remove Domain     (AccountSet)
 * - Set RLUSD / USDC trust line (TrustSet)
 * - Every transaction carries MyWeb3's own SourceTag, so its activity
 *   can be identified on-ledger.
 *
 * The builders return unsigned transactions. The connected wallet
 * (Xaman or Joey via xrpl-connect) fills in Fee and Sequence, signs and submits.
 * Account is optional: Xaman fills it in when omitted; WalletConnect wallets
 * need it, so pass the connected address when you have it.
 */

// ───────────────────────── SourceTag ─────────────────────────

/** Normalize a domain before hashing. Must match the Deterministic SourceTag spec exactly. */
export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // strip protocol (https://)
  d = d.split(/[/?#]/)[0];                     // strip path, query, fragment
  d = d.replace(/:\d+$/, "");                  // strip port
  d = d.replace(/\.$/, "");                    // strip trailing dot
  return d;
}

/** SHA-256 of the normalized domain, first 4 bytes as an unsigned 32-bit integer. */
export async function generateSourceTag(domain: string): Promise<number> {
  const normalized = normalizeDomain(domain).replace(/^www\./, "");
  if (!normalized) throw new Error("Domain is empty");
  const bytes = new TextEncoder().encode(normalized);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  // First 4 bytes, big-endian, unsigned (0 to 4,294,967,295)
  return new DataView(hash.buffer).getUint32(0, false);
}

/** MyWeb3.me's own SourceTag, derived from "myweb3.me". Added to every transaction. */
export const MYWEB3_SOURCE_TAG = 2357011303;

// ───────────────────────── EmailHash ─────────────────────────

const EMAIL_HASH_ZERO = "0".repeat(32);

/** A valid EmailHash is exactly 32 hex characters (128 bits). Returns it uppercased. */
export function normalizeEmailHash(input: string): string {
  const hash = input.trim().toUpperCase();
  if (!/^[0-9A-F]{32}$/.test(hash)) {
    throw new Error("EmailHash must be exactly 32 characters (0-9, A-F)");
  }
  if (hash === EMAIL_HASH_ZERO) {
    throw new Error("Use buildRemoveEmailHash to clear the EmailHash");
  }
  return hash;
}

// ───────────────────────── Domain ─────────────────────────

/** XRPL stores Domain as hex-encoded lowercase ASCII, max 256 bytes. */
export function domainToHex(domain: string): string {
  const normalized = normalizeDomain(domain);
  if (!normalized) throw new Error("Domain is empty");
  if (!/^[\x20-\x7e]+$/.test(normalized)) {
    throw new Error("Domain must be ASCII. Use the punycode form for international domains (xn--...)");
  }
  const bytes = new TextEncoder().encode(normalized);
  if (bytes.length > 256) throw new Error("Domain is longer than 256 bytes");
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Decode the on-ledger Domain field back to text, for "Current Domain". */
export function hexToDomain(hex: string): string {
  const bytes = hex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [];
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ───────────────────────── Transactions ─────────────────────────

export interface AccountSetTx {
  TransactionType: "AccountSet";
  Account?: string;
  SourceTag: number;
  EmailHash?: string;
  Domain?: string;
}

function base(account?: string): AccountSetTx {
  return {
    TransactionType: "AccountSet",
    ...(account ? { Account: account } : {}),
    SourceTag: MYWEB3_SOURCE_TAG,
  };
}

/** Set EmailHash. Replaces any existing value in one transaction. */
export function buildSetEmailHash(hash: string, account?: string): AccountSetTx {
  return { ...base(account), EmailHash: normalizeEmailHash(hash) };
}

/**
 * Remove EmailHash. The ledger deletes the field on 32 zeros; an empty string
 * encodes to those same bytes, and it is the form Xaman accepts — its checker
 * refuses the zeros spelled out (code 618, 2026-10-25).
 */
export function buildRemoveEmailHash(account?: string): AccountSetTx {
  return { ...base(account), EmailHash: "" };
}

/** Set Domain. */
export function buildSetDomain(domain: string, account?: string): AccountSetTx {
  return { ...base(account), Domain: domainToHex(domain) };
}

/** Remove Domain. An empty string tells the ledger to delete the field. */
export function buildRemoveDomain(account?: string): AccountSetTx {
  return { ...base(account), Domain: "" };
}

// ───────────────────────── Trust lines ─────────────────────────

/** Supported stablecoins. Issuer addresses verified for XRPL Mainnet. */
export const STABLECOINS = {
  RLUSD: { issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", currency: "524C555344000000000000000000000000000000" },
  USDC:  { issuer: "rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE", currency: "5553444300000000000000000000000000000000" },
} as const;

export type Stablecoin = keyof typeof STABLECOINS;

/** tfSetNoRipple: recommended for regular holders (prevents rippling through this account). */
const TF_SET_NO_RIPPLE = 0x00020000;

export interface TrustSetTx {
  TransactionType: "TrustSet";
  Account?: string;
  SourceTag: number;
  Flags: number;
  LimitAmount: { currency: string; issuer: string; value: string };
}

/** Set a trust line for RLUSD or USDC. Reserves 0.2 XRP on the account. */
export function buildSetTrustline(token: Stablecoin, account?: string): TrustSetTx {
  const t = STABLECOINS[token];
  if (!t) throw new Error("Unsupported token");
  return {
    TransactionType: "TrustSet",
    ...(account ? { Account: account } : {}),
    SourceTag: MYWEB3_SOURCE_TAG,
    Flags: TF_SET_NO_RIPPLE,
    LimitAmount: { currency: t.currency, issuer: t.issuer, value: "1000000000" },
  };
}

// ───────────────────── Signing (frontend, any wallet) ─────────────────────
//
// With xrpl-connect, one call works for Xaman and Joey:
//
//   const tx = buildSetEmailHash(input, walletManager.account?.address);
//   const result = await walletManager.signAndSubmit(tx);
//
// ───────────────────── Xaman payload (backend only) ─────────────────────
// Use this if the backend creates Xaman payloads directly. The API secret
// must stay on the server (the function's environment variables), never in the browser.

export async function createXamanPayload(
  tx: AccountSetTx | TrustSetTx,
  opts: { apiKey: string; apiSecret: string; returnUrl?: string; identifier?: string },
) {
  const res = await fetch("https://xumm.app/api/v1/platform/payload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": opts.apiKey,
      "X-API-Secret": opts.apiSecret,
    },
    body: JSON.stringify({
      txjson: tx,
      options: { submit: true, ...(opts.returnUrl ? { return_url: { web: opts.returnUrl } } : {}) },
      ...(opts.identifier ? { custom_meta: { identifier: opts.identifier } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Xaman payload failed: ${res.status} ${await res.text()}`);
  // Response includes uuid, next.always (link), refs.qr_png (QR image) and refs.websocket_status (live status)
  return res.json();
}
