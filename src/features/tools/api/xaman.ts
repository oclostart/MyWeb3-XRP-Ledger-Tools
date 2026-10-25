import { request } from '@/lib/api/client'

/**
 * Xaman, through `/api/sign`: the server makes each request with MyWeb3's
 * key, the page shows its link, and Xaman's socket says when it is opened and
 * answered. The answer itself — who signed, the transaction's id — is always
 * read back from the server, never taken from the socket.
 *
 * A dropped socket, or a phone back from the Xaman app with its tab asleep,
 * falls back to asking the server every few seconds.
 */

interface Created {
  uuid: string
  link: string
  websocket: string
}

interface Status {
  opened: boolean
  resolved: boolean
  signed: boolean
  cancelled: boolean
  expired: boolean
  account: string | null
  txid: string | null
  result: string | null
}

/** The step a request reports: its link once made, then whether it is opened. */
export type XamanProgress = { link: string; opened: boolean }

/** How often the server is asked when the socket cannot say. */
const POLL_MS = 5_000

/** Declined in the wallet — told apart from a failure by its name, as `AbortError` is. */
const cancelled = () => Object.assign(new Error('Declined in Xaman'), { name: 'CancelledError' })

const post = <T>(body: object, signal: AbortSignal) =>
  request<T>('/sign', { method: 'POST', body: JSON.stringify(body), signal })

/** Follows a request until Xaman resolves it, or it expires, or the signal withdraws it. */
function follow(created: Created, onProgress: (progress: XamanProgress) => void, signal: AbortSignal): Promise<Status> {
  return new Promise((resolve, reject) => {
    let socket: WebSocket | null = null
    let poll: ReturnType<typeof setInterval> | undefined
    let done = false

    const finish = (settle: () => void) => {
      if (done) return
      done = true
      socket?.close()
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      settle()
    }

    const check = () =>
      post<Status>({ status: created.uuid }, signal)
        .then((status) => {
          if (status.opened) onProgress({ link: created.link, opened: true })
          if (status.resolved || status.expired) finish(() => resolve(status))
        })
        .catch((error: Error) => {
          // A check that fails is tried again on the next tick, unless the
          // request was withdrawn.
          if (error.name === 'AbortError') finish(() => reject(error))
        })

    const startPolling = () => {
      if (!done && poll === undefined) poll = setInterval(check, POLL_MS)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }

    signal.addEventListener('abort', () => finish(() => reject(new DOMException('Withdrawn', 'AbortError'))), {
      once: true,
    })
    document.addEventListener('visibilitychange', onVisible)

    try {
      socket = new WebSocket(created.websocket)
    } catch {
      startPolling()
      return
    }
    socket.onmessage = (event) => {
      let message: { opened?: boolean; signed?: boolean; expired?: boolean }
      try {
        message = JSON.parse(String(event.data)) as typeof message
      } catch {
        return
      }
      if (message.opened) onProgress({ link: created.link, opened: true })
      if (message.signed !== undefined || message.expired) void check()
    }
    socket.onclose = startPolling
  })
}

/** Signs in with a SignIn request, and settles with the account Xaman says signed it. */
export async function connectXaman(onProgress: (progress: XamanProgress) => void, signal: AbortSignal): Promise<string> {
  const created = await post<Created>({ action: 'signin' }, signal)
  onProgress({ link: created.link, opened: false })
  const status = await follow(created, onProgress, signal)
  if (!status.signed) throw status.expired ? new Error('The Xaman request expired') : cancelled()
  if (!status.account) throw new Error('Xaman did not say which account signed')
  return status.account
}

/** Results that mean the ledger never took the transaction, so there is nothing to wait for. */
const REFUSED = /^(tef|tem|tel)/

/**
 * Asks Xaman to sign one of `/api/sign`'s actions for `account`, and settles
 * with the transaction's id once Xaman has submitted it.
 */
export async function signXaman(
  account: string,
  action: { action: string; value?: string },
  onProgress: (progress: XamanProgress) => void,
  signal: AbortSignal,
): Promise<string> {
  const created = await post<Created>({ ...action, account }, signal)
  onProgress({ link: created.link, opened: false })
  const status = await follow(created, onProgress, signal)
  if (!status.signed) throw status.expired ? new Error('The Xaman request expired') : cancelled()
  if (status.account !== account) throw new Error('Signed by another account')
  if (!status.txid || (status.result && REFUSED.test(status.result))) {
    throw new Error(`Xaman's submission failed: ${status.result ?? 'no transaction id'}`)
  }
  return status.txid
}
