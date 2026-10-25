import { useRef, useState, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { applyAccountSet, toAccountSetTx, type AccountChange, type AccountSettings } from '../data/accountSet'
import { STABLECOIN_IDS, isStablecoin, type Stablecoin } from '../data/trustLines'

/**
 * Wallets, and the ledger reads and writes that go through them.
 *
 * **Everything here is a stand-in** until the client's keys exist (H10, H11):
 * connecting walks the steps a real sign-in does — a request prepared, a code
 * to scan, the request opened — and hands back a demo address; "signing"
 * walks the same steps — then signed — and applies the real transaction to a
 * copy of the account kept in this browser. Screens only ever see `WalletApi`, so H10 and
 * H11 replace `standIn` with `/api/sign` for Xaman, `xrpl-connect` for Joey
 * Wallet and a public node for reads, without a screen changing.
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
}

/** What the tools read off an account. */
export interface AccountState extends AccountSettings {
  trustLines: Record<Stablecoin, boolean>
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
 * connection it already has, so it has none.
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
 * it (client, 2026-10-14). `link` as for `SignStep`: Xaman's request; Joey
 * Wallet asks in its own app.
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
  connect(wallet: WalletId, onStep: (step: ConnectStep) => void, signal: AbortSignal): Promise<WalletSession>
  readAccount(address: string): Promise<AccountState>
  /**
   * Asks the wallet to sign, reporting each step, and settles once the ledger
   * has it — or it was cancelled, or failed, which are steps too. Aborting the
   * signal withdraws the request.
   */
  sign(session: WalletSession, request: SignRequest, onStep: (step: SignStep) => void, signal: AbortSignal): Promise<void>
}

// ── The stand-in ─────────────────────────────────────────────────────────

/** The Canva's sample address — plainly not a real account, which is the point. */
const DEMO_ADDRESS: Record<WalletId, string> = {
  xaman: 'rasda7ad71d1877827d171jv3kj2jkkvj1z',
  joey: 'rjoeyd71d1877827d171jv3kj2jkkvj1z',
  ledger: 'rledgerd71d1877827d171jv3kj2jkkvj1',
}

const LEDGER_KEY = 'myweb3.tools.standInLedger'
const noTrustLines = () => Object.fromEntries(STABLECOIN_IDS.map((id) => [id, false])) as Record<Stablecoin, boolean>
const EMPTY = (): AccountState => ({ domain: '', emailHash: '', trustLines: noTrustLines() })

function readLedger(): Record<string, AccountState> {
  try {
    const saved = JSON.parse(localStorage.getItem(LEDGER_KEY) ?? '{}') as Record<string, Partial<AccountState>>
    return Object.fromEntries(
      Object.entries(saved).map(([address, account]) => [
        address,
        { ...EMPTY(), ...account, trustLines: { ...noTrustLines(), ...account.trustLines } },
      ]),
    )
  } catch {
    return {}
  }
}

function writeLedger(ledger: Record<string, AccountState>) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger))
  } catch {
    // Kept for this visit only.
  }
}

/** Resolves after `ms`, or rejects the moment the request is withdrawn. */
const pause = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Withdrawn', 'AbortError'))
    })
  })

const fakeTxid = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

/** A change applied as the ledger would, once signed. */
function apply(account: AccountState, address: string, request: SignRequest): AccountState {
  if (request.action === 'set_trustline') {
    return isStablecoin(request.value) ? { ...account, trustLines: { ...account.trustLines, [request.value]: true } } : account
  }
  const change: AccountChange =
    request.action === 'set_domain'
      ? { domain: request.value }
      : request.action === 'remove_domain'
        ? { domain: '' }
        : request.action === 'set_emailhash'
          ? { emailHash: request.value }
          : { emailHash: '' }
  return { ...account, ...applyAccountSet(account, toAccountSetTx(address, change)) }
}

/**
 * Pauses are long enough to show each waiting state, so the screens are built
 * against the delays the real ones will have rather than an instant answer
 * they will never get.
 */
const standIn: WalletApi = {
  async connect(wallet, onStep, signal) {
    onStep({ step: 'preparing' })
    await pause(600, signal)
    const link = wallet === 'xaman' ? `https://xumm.app/sign/${fakeTxid().slice(0, 32).toLowerCase()}` : undefined
    onStep({ step: 'waiting', link })
    await pause(2500, signal)
    onStep({ step: 'opened', link })
    await pause(1200, signal)
    return { wallet, address: DEMO_ADDRESS[wallet] }
  },
  async readAccount(address) {
    await pause(300)
    return readLedger()[address] ?? EMPTY()
  },
  async sign(session, request, onStep, signal) {
    try {
      onStep({ step: 'preparing' })
      await pause(600, signal)
      const link = session.wallet === 'xaman' ? `https://xumm.app/sign/${fakeTxid().slice(0, 32).toLowerCase()}` : undefined
      onStep({ step: 'waiting', link })
      await pause(2500, signal)
      onStep({ step: 'opened', link })
      await pause(1500, signal)
      const ledger = readLedger()
      ledger[session.address] = apply(ledger[session.address] ?? EMPTY(), session.address, request)
      writeLedger(ledger)
      onStep({ step: 'signed', txid: fakeTxid() })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') onStep({ step: 'failed' })
    }
  },
}

const api: WalletApi = standIn

// ── The connected wallet, shared by every tools screen ───────────────────

/**
 * Held outside React and in storage, because each tools screen mounts its own
 * shell: state in a component would forget the wallet on every navigation,
 * and a real wallet keeps its session across visits anyway.
 */
const SESSION_KEY = 'myweb3.tools.wallet'

function readSession(): WalletSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as WalletSession | null
    return saved && WALLETS.some((w) => w.id === saved.wallet) && saved.address ? saved : null
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
 * the session once it lands. Aborting the signal withdraws the request.
 */
export async function connectWallet(wallet: WalletId, onStep: (step: ConnectStep) => void, signal: AbortSignal) {
  const session = await api.connect(wallet, onStep, signal)
  setSession(session)
  return session
}

export function disconnectWallet() {
  setSession(null)
}

const accountKey = (address: string) => ['tools', 'account', address] as const

export function useAccount(address: string | undefined) {
  return useQuery({
    queryKey: accountKey(address ?? ''),
    queryFn: () => api.readAccount(address ?? ''),
    enabled: Boolean(address),
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
