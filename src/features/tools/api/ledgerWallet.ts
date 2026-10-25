import type Transport from '@ledgerhq/hw-transport'
import type Xrp from '@ledgerhq/hw-app-xrp'
import { LedgerError, ledgerRequest } from './ledger'

/**
 * A Ledger device, over USB (WebHID) or Bluetooth (Web Bluetooth), with its
 * XRP app open (client, 2026-10-25: both links). The page builds the
 * transaction, fills in what the ledger needs — sequence, fee, last ledger —
 * has the device sign it, and submits it to Mainnet itself.
 *
 * Only Chromium browsers on a computer or Android give a page USB or
 * Bluetooth; `ledgerLinks` says which this one has. The libraries load only
 * when Ledger is used.
 *
 * Built without a device to try it on (client, 2026-10-25: no hardware
 * wallet to test with).
 */
export type LedgerLink = 'usb' | 'bluetooth'

/** The first account of the XRP app — the one Ledger Live shows as XRP 1. */
const PATH = "44'/144'/0'/0/0"

/** A ceiling on the fee the page fills in, in drops (0.001 XRP); a busier network is refused, not paid. */
const MAX_FEE_DROPS = 1_000

/** How many ledgers, about four seconds each, the transaction may wait to get in. */
const LEDGERS_TO_LAND = 20

/** The device's answers for "rejected on the device": the XRP app's, and newer firmware's. */
const REJECTED = [0x6985, 0x5501]

const cancelled = () => Object.assign(new Error('Rejected on the Ledger'), { name: 'CancelledError' })

/** The links this browser offers a page, USB first. */
export function ledgerLinks(): LedgerLink[] {
  if (typeof navigator === 'undefined') return []
  const links: LedgerLink[] = []
  if ('hid' in navigator) links.push('usb')
  if ('bluetooth' in navigator) links.push('bluetooth')
  return links
}

/** Settles as `promise` does, or rejects with an `AbortError` the moment the signal withdraws it. */
const unlessWithdrawn = <T>(promise: Promise<T>, signal: AbortSignal) =>
  new Promise<T>((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Withdrawn', 'AbortError')), { once: true })
    promise.then(resolve, reject)
  })

/**
 * The Ledger libraries expect Node's `Buffer` as a global, which a browser
 * lacks; it is put there before they load.
 */
async function withBuffer(): Promise<void> {
  const { Buffer } = await import('buffer')
  const global = globalThis as { Buffer?: typeof Buffer }
  global.Buffer ??= Buffer
}

/**
 * Loads the libraries ahead of a click: the browser lets a page ask for a
 * device only within a few seconds of one, which a slow download could use up.
 */
export function preloadLedger(): void {
  withBuffer()
    .then(() =>
      Promise.all([
        import('@ledgerhq/hw-transport-webhid'),
        import('@ledgerhq/hw-transport-web-ble'),
        import('@ledgerhq/hw-app-xrp'),
        import('ripple-binary-codec'),
      ]),
    )
    .catch((error: unknown) => console.warn('Ledger: the libraries did not load', error))
}

let open: { link: LedgerLink; transport: Transport } | null = null

/**
 * The connection to the device, kept for the visit. A new one asks the
 * browser for the device — a choice the person makes, so it must follow
 * their click; USB reuses a device already allowed without asking again.
 */
async function connection(link: LedgerLink): Promise<Transport> {
  if (open?.link === link) return open.transport
  await withBuffer()
  let transport: Transport
  if (link === 'usb') {
    const { default: TransportWebHID } = await import('@ledgerhq/hw-transport-webhid')
    transport = (await TransportWebHID.openConnected()) ?? (await TransportWebHID.create())
  } else {
    const { default: TransportWebBLE } = await import('@ledgerhq/hw-transport-web-ble')
    transport = await TransportWebBLE.create()
  }
  transport.on('disconnect', () => {
    if (open?.transport === transport) open = null
  })
  open = { link, transport }
  return transport
}

async function xrpApp(link: LedgerLink): Promise<Xrp> {
  const transport = await connection(link)
  const { default: XrpApp } = await import('@ledgerhq/hw-app-xrp')
  return new XrpApp(transport)
}

/** A refusal on the device becomes a `CancelledError`; anything else is passed on. */
function onDevice<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((error: unknown) => {
    const status = (error as { statusCode?: unknown }).statusCode
    throw typeof status === 'number' && REJECTED.includes(status) ? cancelled() : error
  })
}

/**
 * Connects over `link` and settles with the device's XRP account, once the
 * person has confirmed it on the device's screen.
 */
export async function connectLedger(link: LedgerLink, signal: AbortSignal): Promise<string> {
  const xrp = await unlessWithdrawn(xrpApp(link), signal)
  const { address } = await unlessWithdrawn(onDevice(xrp.getAddress(PATH, true)), signal)
  return address
}

interface FeeResult {
  ledger_current_index: number
  drops: { base_fee: string; open_ledger_fee: string }
}

interface AccountInfoResult {
  account_data: { Sequence: number }
}

interface SubmitResult {
  engine_result: string
  tx_json: { hash?: string }
}

/** What the ledger needs beyond the transaction itself: sequence, fee, last ledger. */
async function fill(tx: object, account: string, signal: AbortSignal) {
  const [info, fee] = await Promise.all([
    ledgerRequest<AccountInfoResult>('account_info', { account, ledger_index: 'current' }, signal).catch(
      (error: unknown) => {
        if (error instanceof LedgerError && error.code === 'actNotFound') {
          throw new Error('This account is not activated on Mainnet yet')
        }
        throw error
      },
    ),
    ledgerRequest<FeeResult>('fee', {}, signal),
  ])
  const drops = Math.max(Number(fee.drops.base_fee), Number(fee.drops.open_ledger_fee))
  if (!Number.isFinite(drops) || drops > MAX_FEE_DROPS) throw new Error(`The network fee is too high right now: ${drops} drops`)
  return {
    ...tx,
    Sequence: info.account_data.Sequence,
    Fee: String(drops),
    LastLedgerSequence: fee.ledger_current_index + LEDGERS_TO_LAND,
  }
}

/** Results that mean the ledger never took the transaction, so there is nothing to wait for. */
const REFUSED = /^(tef|tem|tel)/

/**
 * Has the device sign `tx` for `address` and submits it, settling with its
 * hash. The device must hold that account: another Ledger, or another
 * account on it, is refused before anything is signed.
 */
export async function signLedger(
  address: string,
  link: LedgerLink,
  tx: object,
  signal: AbortSignal,
): Promise<string> {
  // The device first: a new connection must follow the person's click.
  const xrp = await unlessWithdrawn(xrpApp(link), signal)
  const { address: held, publicKey } = await unlessWithdrawn(onDevice(xrp.getAddress(PATH)), signal)
  if (held !== address) throw new Error('This Ledger holds another account; connect it again')

  const { encode } = await import('ripple-binary-codec')
  const unsigned = { ...(await fill(tx, address, signal)), SigningPubKey: publicKey.toUpperCase() }
  const signature = await unlessWithdrawn(onDevice(xrp.signTransaction(PATH, encode(unsigned))), signal)
  const tx_blob = encode({ ...unsigned, TxnSignature: signature.toUpperCase() })

  const result = await ledgerRequest<SubmitResult>('submit', { tx_blob }, signal)
  if (REFUSED.test(result.engine_result)) throw new Error(`The ledger refused the transaction: ${result.engine_result}`)
  if (!result.tx_json.hash) throw new Error('The ledger returned no transaction hash')
  return result.tx_json.hash
}

/** Lets the device go. The page forgets the session either way. */
export function disconnectLedger(): void {
  const current = open
  open = null
  current?.transport.close().catch((error: unknown) => console.warn('Ledger: the device could not be released', error))
}
