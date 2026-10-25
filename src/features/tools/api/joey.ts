import type SignClient from '@walletconnect/sign-client'

/**
 * Joey Wallet, over WalletConnect (Reown): the page pairs with the app by a
 * `wc:` link — a code on a desktop, `joey://` on a phone — and then asks it
 * to sign over that connection. Joey signs and submits itself
 * (`xrpl_signTransaction`, `submit: true`) and answers with the hash.
 *
 * The WalletConnect client keeps its sessions in this browser, so a page
 * reloaded later still reaches the Joey it paired with. It is loaded only
 * when Joey is used.
 *
 * Mainnet only: `xrpl:0`, Joey's id for it. A Joey on another network refuses.
 */

/** Public by design (the client's runbook §3); the build's variable wins. */
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? '5ba605496e07f624f16dbf5028db57fd'

const CHAIN = 'xrpl:0'
const METHOD = 'xrpl_signTransaction'

/** WalletConnect's codes: the person said no; the page ended the session. */
const USER_REJECTED = 5000
const USER_DISCONNECTED = { code: 6000, message: 'User disconnected.' }

/** Declined in the wallet — told apart from a failure by its name, as `AbortError` is. */
const cancelled = () => Object.assign(new Error('Declined in Joey Wallet'), { name: 'CancelledError' })

let client: Promise<SignClient> | null = null
const watchers = new Set<(live: string[]) => void>()

const addressOf = (session: { namespaces: Record<string, { accounts: string[] }> }) =>
  session.namespaces.xrpl?.accounts.find((account) => account.startsWith(`${CHAIN}:`))?.slice(CHAIN.length + 1)

function joeyClient(): Promise<SignClient> {
  client ??= import('@walletconnect/sign-client')
    .then(({ SignClient }) =>
      SignClient.init({
        projectId: PROJECT_ID,
        metadata: {
          name: 'MyWeb3.me Tools',
          description: 'XRP Ledger tools by MyWeb3.me',
          url: window.location.origin,
          icons: [`${window.location.origin}/icon-512.png`],
        },
      }),
    )
    .then((wc) => {
      // Joey's only event: a session ended in the app. It is gone from the
      // client's store by the time the event lands, so watchers are told
      // which accounts are still live — once now too, for sessions that
      // expired between visits.
      const report = () => {
        const live = wc.session.getAll().flatMap((s) => addressOf(s) ?? [])
        watchers.forEach((watcher) => watcher(live))
      }
      wc.on('session_delete', report)
      report()
      return wc
    })
    .catch((error: unknown) => {
      client = null
      throw error
    })
  return client
}

/** Settles as `promise` does, or rejects with an `AbortError` the moment the signal withdraws it. */
const unlessWithdrawn = <T>(promise: Promise<T>, signal: AbortSignal) =>
  new Promise<T>((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Withdrawn', 'AbortError')), { once: true })
    promise.then(resolve, reject)
  })

/**
 * Calls `watcher` with the accounts that still have a Joey session, once the
 * client has loaded and whenever a session ends in the app. Loads the client,
 * so a session from an earlier visit is checked too.
 */
export function watchJoey(watcher: (live: string[]) => void): void {
  watchers.add(watcher)
  joeyClient().catch((error: unknown) => console.warn('Joey Wallet: WalletConnect did not start', error))
}

/** Pairs with Joey, reporting the `wc:` link to show, and settles with the account it shares. */
export async function connectJoey(onLink: (uri: string) => void, signal: AbortSignal): Promise<string> {
  const wc = await unlessWithdrawn(joeyClient(), signal)
  const { uri, approval } = await wc.connect({
    optionalNamespaces: { xrpl: { chains: [CHAIN], methods: [METHOD], events: [] } },
  })
  if (!uri) throw new Error('WalletConnect gave no pairing link')
  onLink(uri)
  const session = await unlessWithdrawn(approval(), signal)
  const address = addressOf(session)
  if (!address) {
    void wc.disconnect({ topic: session.topic, reason: USER_DISCONNECTED })
    throw new Error('Joey Wallet shared no Mainnet account')
  }
  return address
}

/**
 * Asks Joey to sign `tx` and submit it, and settles with its hash. Joey fills
 * in the fee, sequence and last ledger (`autofill`).
 */
export async function signJoey(address: string, tx: object, signal: AbortSignal): Promise<string> {
  const wc = await unlessWithdrawn(joeyClient(), signal)
  const session = wc.session.getAll().find((s) => addressOf(s) === address)
  if (!session) throw new Error('No Joey Wallet session for this account; connect again')
  let result: { tx_json?: { hash?: string } }
  try {
    result = await unlessWithdrawn(
      wc.request<typeof result>({
        topic: session.topic,
        chainId: CHAIN,
        request: { method: METHOD, params: { tx_json: tx, autofill: true, submit: true } },
      }),
      signal,
    )
  } catch (error) {
    if ((error as { code?: unknown }).code === USER_REJECTED) throw cancelled()
    throw error
  }
  const hash = result.tx_json?.hash
  if (!hash) throw new Error('Joey Wallet returned no transaction hash')
  return hash
}

/** Ends the session in Joey too. The page forgets it either way. */
export function disconnectJoey(address: string): void {
  joeyClient()
    .then((wc) => {
      const session = wc.session.getAll().find((s) => addressOf(s) === address)
      return session && wc.disconnect({ topic: session.topic, reason: USER_DISCONNECTED })
    })
    .catch((error: unknown) => console.warn('Joey Wallet: the session could not be ended in the app', error))
}
