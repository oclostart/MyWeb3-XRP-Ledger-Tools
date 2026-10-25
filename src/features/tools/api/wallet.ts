import { useRef, useState, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toAccountSetTx, type AccountChange } from '../data/accountSet'
import { toTrustSetTx, type Stablecoin } from '../data/trustLines'
import { readAccount, waitForValidated, type AccountState } from './ledger'
import { connectXaman, signXaman } from './xaman'
import { connectJoey, disconnectJoey, signJoey, watchJoey } from './joey'
import { connectLedger, disconnectLedger, signLedger, type LedgerLink } from './ledgerWallet'

export type { AccountState, LedgerLink }

/**
 * Wallets, and the ledger reads and writes that go through them — on XRPL
 * Mainnet, with real accounts only (client, 2026-10-25: no demo data, no
 * fallback to one).
 *
 * - **Xaman** signs in and signs through `/api/sign` (H10): the server makes
 *   each request with MyWeb3's key and builds the transaction (`xaman.ts`).
 * - **Joey Wallet** pairs over WalletConnect and signs the transaction built
 *   here (H11, `joey.ts`).
 * - **Ledger** signs on the device, over USB or Bluetooth, the transaction
 *   built here; the page submits it (`ledgerWallet.ts`). All three carry
 *   MyWeb3's SourceTag.
 * - **Reads** come from a public node (`ledger.ts`), and a signature counts
 *   only once its transaction is in a validated ledger.
 *
 * Screens only ever see `WalletApi`.
 */
export type WalletId = 'xaman' | 'joey' | 'ledger'

/**
 * `name` is the wallet's own, under its icon and in the lines that point to
 * it ("Open the Joey Wallet and scan this QR code."); `short` is the one a window's
 * title carries — "Connect with Joey", "Sign with Joey" (client, 2026-10-14).
 */
export const WALLETS: ReadonlyArray<{ id: WalletId; name: string; short: string }> = [
  { id: 'xaman', name: 'Xaman', short: 'Xaman' },
  { id: 'joey', name: 'Joey Wallet', short: 'Joey' },
  { id: 'ledger', name: 'Ledger', short: 'Ledger' },
]

export const walletName = (id: WalletId) => WALLETS.find((w) => w.id === id)?.name ?? id

/** The wallet's name in a window's title — "Joey" for Joey Wallet. */
export const walletShortName = (id: WalletId) => WALLETS.find((w) => w.id === id)?.short ?? id

export interface WalletSession {
  wallet: WalletId
  address: string
  /** How a Ledger is reached — the link it was connected over. */
  via?: LedgerLink
}

/**
 * What a signature is for — the actions `/api/sign` takes (H10), each with
 * its value: a domain, a hash, a stablecoin.
 */
export type SignRequest =
  | { action: 'set_domain'; value: string }
  | { action: 'remove_domain' }
  | { action: 'set_emailhash'; value: string }
  | { action: 'remove_emailhash' }
  | { action: 'set_trustline'; value: Stablecoin }

/**
 * Where a signature has got to, as the signing window shows it. `link` is the
 * request a phone opens — Xaman's; Joey Wallet asks in its own app over the
 * connection it already has, so it has none. `signed` comes only once the
 * ledger has validated the transaction.
 */
export type SignStep =
  | { step: 'preparing' }
  | { step: 'waiting'; link?: string }
  | { step: 'opened'; link?: string }
  | { step: 'signed'; txid: string }
  | { step: 'cancelled' }
  | { step: 'failed' }

/**
 * Where a sign-in has got to, as the Wallet window's Connect with Xaman shows
 * it (client, 2026-10-14). `link` is Xaman's request, or for Joey Wallet the
 * WalletConnect pairing link (`wc:`) its app scans or opens.
 */
export type ConnectStep =
  | { step: 'preparing' }
  | { step: 'waiting'; link?: string }
  | { step: 'opened'; link?: string }

export interface WalletApi {
  /**
   * Signs the person in, reporting each step, and settles with the session —
   * or rejects, with an `AbortError` when the signal withdraws the request.
   */
  connect(
    wallet: WalletId,
    onStep: (step: ConnectStep) => void,
    signal: AbortSignal,
    via?: LedgerLink,
  ): Promise<WalletSession>
  readAccount(address: string): Promise<AccountState>
  /**
   * Asks the wallet to sign, reporting each step, and settles once the ledger
   * has it — or it was cancelled, or failed, which are steps too. Aborting the
   * signal withdraws the request.
   */
  sign(session: WalletSession, request: SignRequest, onStep: (step: SignStep) => void, signal: AbortSignal): Promise<void>
}

// ── The wallets ──────────────────────────────────────────────────────────

/** The transaction Joey Wallet and Ledger are asked to sign; Xaman's is built on the server from the same request. */
function toTransaction(address: string, request: SignRequest) {
  if (request.action === 'set_trustline') return toTrustSetTx(address, request.value)
  const change: AccountChange =
    request.action === 'set_domain'
      ? { domain: request.value }
      : request.action === 'remove_domain'
        ? { domain: '' }
        : request.action === 'set_emailhash'
          ? { emailHash: request.value }
          : { emailHash: '' }
  return toAccountSetTx(address, change)
}

const real: WalletApi = {
  async connect(wallet, onStep, signal, via) {
    onStep({ step: 'preparing' })
    if (wallet === 'ledger') {
      if (!via) throw new Error('A Ledger connects over USB or Bluetooth')
      onStep({ step: 'waiting' })
      return { wallet, address: await connectLedger(via, signal), via }
    }
    const address =
      wallet === 'xaman'
        ? await connectXaman(({ link, opened }) => onStep({ step: opened ? 'opened' : 'waiting', link }), signal)
        : await connectJoey((link) => onStep({ step: 'waiting', link }), signal)
    return { wallet, address }
  },
  readAccount: (address) => readAccount(address),
  async sign(session, request, onStep, signal) {
    try {
      onStep({ step: 'preparing' })
      let txid: string
      if (session.wallet === 'xaman') {
        txid = await signXaman(
          session.address,
          request,
          ({ link, opened }) => onStep({ step: opened ? 'opened' : 'waiting', link }),
          signal,
        )
      } else if (session.wallet === 'ledger') {
        if (!session.via) throw new Error('No Ledger link kept; connect again')
        onStep({ step: 'waiting' })
        txid = await signLedger(session.address, session.via, toTransaction(session.address, request), signal)
      } else {
        onStep({ step: 'waiting' })
        txid = await signJoey(session.address, toTransaction(session.address, request), signal)
      }
      onStep((await waitForValidated(txid, signal)) ? { step: 'signed', txid } : { step: 'failed' })
    } catch (error) {
      const name = (error as Error).name
      if (name === 'AbortError') return
      onStep(name === 'CancelledError' ? { step: 'cancelled' } : { step: 'failed' })
    }
  },
}

const api: WalletApi = real

// ── The connected wallet, shared by every tools screen ───────────────────

/**
 * Held outside React and in storage, because each tools screen mounts its own
 * shell: state in a component would forget the wallet on every navigation,
 * and a real wallet keeps its session across visits anyway.
 */
const SESSION_KEY = 'myweb3.tools.session'

/**
 * What the browser stand-in kept until 2026-10-25 — a session on a demo
 * address, and its copy of the ledger — dropped, so no visitor comes back
 * "connected" to an account that does not exist.
 */
const STAND_IN_KEYS = ['myweb3.tools.wallet', 'myweb3.tools.standInLedger']

if (typeof window !== 'undefined') {
  try {
    STAND_IN_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage is blocked; there is nothing kept to drop.
  }
}

function readSession(): WalletSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as WalletSession | null
    if (!saved || !WALLETS.some((w) => w.id === saved.wallet) || !saved.address) return null
    if (saved.wallet === 'ledger' && saved.via !== 'usb' && saved.via !== 'bluetooth') return null
    return saved
  } catch {
    return null
  }
}

let session: WalletSession | null = readSession()
const listeners = new Set<() => void>()

function setSession(next: WalletSession | null) {
  session = next
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Another tab connecting or disconnecting lands here too, so two tabs never
// disagree about whether a wallet is connected. `key` is null when the
// storage was cleared outright.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== SESSION_KEY && event.key !== null) return
    session = readSession()
    listeners.forEach((listener) => listener())
  })
}

export function useWalletSession(): WalletSession | null {
  return useSyncExternalStore(subscribe, () => session, () => null)
}

/**
 * Signs in with `wallet`, reporting each step to the Wallet window, and keeps
 * the session once it lands. A Ledger needs `via`, the link to reach it over.
 * Aborting the signal withdraws the request.
 */
export async function connectWallet(
  wallet: WalletId,
  onStep: (step: ConnectStep) => void,
  signal: AbortSignal,
  via?: LedgerLink,
) {
  const session = await api.connect(wallet, onStep, signal, via)
  setSession(session)
  if (wallet === 'joey') watchJoeySessions()
  return session
}

export function disconnectWallet() {
  if (session?.wallet === 'joey') disconnectJoey(session.address)
  if (session?.wallet === 'ledger') disconnectLedger()
  setSession(null)
}

let watchingJoey = false

/**
 * A Joey session ended in the app, or expired since the last visit, is a
 * wallet no longer connected. Watched from the first Joey connection, or from
 * load when one is kept.
 */
function watchJoeySessions() {
  if (watchingJoey) return
  watchingJoey = true
  watchJoey((live) => {
    if (session?.wallet === 'joey' && !live.includes(session.address)) setSession(null)
  })
}

if (typeof window !== 'undefined' && session?.wallet === 'joey') watchJoeySessions()

const accountKey = (address: string) => ['tools', 'account', address] as const

export function useAccount(address: string | undefined) {
  return useQuery({
    queryKey: accountKey(address ?? ''),
    queryFn: () => api.readAccount(address ?? ''),
    enabled: Boolean(address),
    // Each read already falls back to a second node; one more try is enough before the page gives up.
    retry: 1,
  })
}

/** One signature in progress, as the signing window shows it. */
export interface SigningRun {
  session: WalletSession
  request: SignRequest
  step: SignStep
}

/**
 * A screen's way to ask for a signature: `start` opens the signing window on
 * a request, `retry` asks again after a cancel or a failure, `close` shuts the
 * window — withdrawing the request if it is still waiting.
 *
 * **A signature that lands closes the window** (client, 2026-10-13): the
 * wallet already shows the transaction went through, and the page shows what
 * changed — a Signed window said it a third time. The account is read again
 * first and the window closes once it is, so the page never shows the old
 * value between the two. A run therefore never holds the `signed` step.
 */
export function useSigning() {
  const client = useQueryClient()
  const [run, setRun] = useState<SigningRun | null>(null)
  const current = useRef<AbortController | null>(null)

  const start = (who: WalletSession, request: SignRequest) => {
    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    setRun({ session: who, request, step: { step: 'preparing' } })
    void api.sign(
      who,
      request,
      (step) => {
        if (controller.signal.aborted) return
        if (step.step === 'signed') {
          void client.invalidateQueries({ queryKey: accountKey(who.address) }).then(() => {
            if (current.current === controller) close()
          })
          return
        }
        setRun((now) => (now ? { ...now, step } : now))
      },
      controller.signal,
    )
  }

  const close = () => {
    current.current?.abort()
    current.current = null
    setRun(null)
  }

  const retry = () => {
    if (run) start(run.session, run.request)
  }

  return { run, start, close, retry }
}

export type Signing = ReturnType<typeof useSigning>
