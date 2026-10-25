import { useQuery } from '@tanstack/react-query'
import { fromLedger, type AccountSettings } from '../data/accountSet'
import { STABLECOINS, STABLECOIN_IDS, TRUST_LINE_RESERVE_XRP, type Stablecoin } from '../data/trustLines'

/**
 * Reads straight off the XRP Ledger, through a public node — no wallet, no
 * account.
 *
 * `xrplcluster.com` because it answers a page's own request: it sends
 * `Access-Control-Allow-Origin: *`, where Ripple's `s1` and `s2` refuse a
 * browser outright (checked 2026-10-19). It is a cluster of full-history
 * servers behind one address, on Mainnet, the only network the tools use.
 */
const NODE = 'https://xrplcluster.com/'

/**
 * The fallback: Ripple's own server, over its WebSocket — a socket has no
 * CORS, so `s1` answers a page there though it refuses its HTTP requests.
 */
const FALLBACK = 'wss://s1.ripple.com/'

/** A command a node refused, with its error code — `actNotFound`, `txnNotFound`. */
export class LedgerError extends Error {
  readonly code: string

  constructor(code: string) {
    super(`The ledger answered ${code}`)
    this.name = 'LedgerError'
    this.code = code
  }
}

interface NodeResult {
  status?: string
  error?: string
}

/**
 * How long `xrplcluster.com` is given before `s1` is asked instead: a request
 * a network or blocker holds open, never answered, would otherwise leave the
 * page loading for good (client, 2026-10-25).
 */
const HTTP_TIMEOUT_MS = 6_000

async function overHttp(method: string, params: object, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController()
  const withdraw = () => controller.abort()
  signal?.addEventListener('abort', withdraw, { once: true })
  const timer = setTimeout(withdraw, HTTP_TIMEOUT_MS)
  try {
    const response = await fetch(NODE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params: [params] }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${method} answered ${response.status}`)
    return ((await response.json()) as { result?: unknown }).result
  } catch (error) {
    // Only the caller's own withdrawal is an AbortError; a timeout is a node that did not answer.
    if (signal?.aborted || (error as Error).name !== 'AbortError') throw error
    throw new Error(`${method} timed out`)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', withdraw)
  }
}

function overSocket(method: string, params: object, signal?: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(FALLBACK)
    const end = (settle: () => void) => {
      clearTimeout(timer)
      socket.close()
      settle()
    }
    const timer = setTimeout(() => end(() => reject(new Error(`${method} timed out`))), 10_000)
    signal?.addEventListener('abort', () => end(() => reject(new DOMException('Withdrawn', 'AbortError'))))
    socket.onopen = () => socket.send(JSON.stringify({ id: 1, command: method, ...params }))
    socket.onerror = () => end(() => reject(new Error(`${method}: the fallback node could not be reached`)))
    socket.onmessage = (event) =>
      end(() => {
        try {
          const answer = JSON.parse(String(event.data)) as { result?: unknown; error?: string; status?: string }
          resolve(answer.status === 'error' ? { status: 'error', error: answer.error } : answer.result)
        } catch (error) {
          reject(error)
        }
      })
  })
}

/** Set once `xrplcluster.com` fails: every later command this visit goes straight to `s1`, not waiting out the timeout again. */
let httpUnreachable = false

/**
 * One command to Mainnet: `xrplcluster.com` first, `s1` if it cannot be
 * reached. A command the ledger itself refuses throws a `LedgerError`; it is
 * not asked again.
 */
export async function ledgerRequest<T>(method: string, params: object, signal?: AbortSignal): Promise<T> {
  let result: unknown
  try {
    if (httpUnreachable) throw new Error('xrplcluster.com did not answer earlier this visit')
    result = await overHttp(method, params, signal)
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    httpUnreachable = true
    result = await overSocket(method, params, signal)
  }
  const answer = (result ?? {}) as NodeResult
  if (answer.status === 'error' || answer.error) throw new LedgerError(answer.error ?? 'error')
  return result as T
}

/** XRP is a million drops. */
const DROPS_PER_XRP = 1_000_000

/**
 * The owner reserve — what each object an account owns, a trust line among
 * them, holds back — from the last validated ledger, in XRP. `server_state`
 * gives it in whole drops (`reserve_inc`), where `server_info`'s XRP figure is
 * a float.
 */
async function readOwnerReserve(signal: AbortSignal): Promise<number> {
  const result = await ledgerRequest<{ state?: { validated_ledger?: { reserve_inc?: unknown } } }>('server_state', {}, signal)
  const drops = result.state?.validated_ledger?.reserve_inc
  if (typeof drops !== 'number' || !Number.isFinite(drops) || drops < 0) throw new Error('No reserve in server_state')
  return drops / DROPS_PER_XRP
}

/**
 * The reserve a trust line holds, as the ledger has it now (client,
 * 2026-10-19): validators vote the reserves, so a figure written into the page
 * would go stale the day they change. Read once a visit and kept for an hour.
 *
 * Until the answer lands, or if the node cannot be reached, it is the value
 * the ledger has held since December 2024 — 0.2 XRP — so the line under the
 * boxes is never empty and never jumps.
 */
export function useTrustLineReserve(): number {
  const { data } = useQuery({
    queryKey: ['tools', 'ledger', 'ownerReserve'],
    queryFn: ({ signal }) => readOwnerReserve(signal),
    staleTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: TRUST_LINE_RESERVE_XRP,
  })
  return data ?? TRUST_LINE_RESERVE_XRP
}

/** What the tools read off an account. */
export interface AccountState extends AccountSettings {
  trustLines: Record<Stablecoin, boolean>
}

interface TrustLine {
  account: string
  currency: string
  limit: string
}

/**
 * An account's Domain, EmailHash and stablecoin trust lines, from the last
 * validated ledger (`account_info`, `account_lines`). An account the ledger
 * does not have yet — never funded — has none of them.
 */
export async function readAccount(address: string, signal?: AbortSignal): Promise<AccountState> {
  const trustLines = Object.fromEntries(STABLECOIN_IDS.map((id) => [id, false])) as Record<Stablecoin, boolean>
  let info: { account_data?: { Domain?: string; EmailHash?: string } }
  try {
    info = await ledgerRequest('account_info', { account: address, ledger_index: 'validated' }, signal)
  } catch (error) {
    if (error instanceof LedgerError && error.code === 'actNotFound') return { domain: '', emailHash: '', trustLines }
    throw error
  }

  let marker: unknown
  do {
    const page: { lines?: TrustLine[]; marker?: unknown } = await ledgerRequest(
      'account_lines',
      { account: address, ledger_index: 'validated', limit: 400, ...(marker ? { marker } : {}) },
      signal,
    )
    for (const line of page.lines ?? []) {
      const coin = STABLECOIN_IDS.find((id) => STABLECOINS[id].issuer === line.account && STABLECOINS[id].currency === line.currency)
      if (coin && Number(line.limit) > 0) trustLines[coin] = true
    }
    marker = page.marker
  } while (marker)

  return { ...fromLedger(info.account_data ?? {}), trustLines }
}

/** How long a submitted transaction is waited for: past its LastLedgerSequence, which wallets set about 20 ledgers on. */
const VALIDATION_TIMEOUT_MS = 120_000

/**
 * Waits for a submitted transaction to be in a validated ledger, and says
 * whether it succeeded there (`tesSUCCESS`). A wallet's own "submitted" is
 * only provisional: the ledger can still reject it. Rejects if it is not
 * validated in time, or with an `AbortError` when the signal withdraws it.
 */
export async function waitForValidated(hash: string, signal: AbortSignal): Promise<boolean> {
  const until = Date.now() + VALIDATION_TIMEOUT_MS
  while (Date.now() < until) {
    try {
      const tx = await ledgerRequest<{ validated?: boolean; meta?: { TransactionResult?: string } }>('tx', { transaction: hash }, signal)
      if (tx.validated) return tx.meta?.TransactionResult === 'tesSUCCESS'
    } catch (error) {
      // Not found yet is the usual answer for the first few seconds; a node
      // that did not answer is asked again too.
      if ((error as Error).name === 'AbortError') throw error
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 2_000)
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new DOMException('Withdrawn', 'AbortError'))
        },
        { once: true },
      )
    })
  }
  throw new Error(`${hash} was not validated in time`)
}
