/**
 * POST /api/sign — the site's only backend (H10, the client's runbook §2).
 *
 * It builds the transaction on the server and creates a Xaman sign request
 * for it. **The browser never sends a transaction**, only
 * `{ action, value, account }`; the transaction is built here with the
 * client's helpers, so nobody can use MyWeb3's Xaman key to ask for a
 * signature on anything else.
 *
 * Two more requests, so Xaman's sign-in and its answers go through here too:
 * - `{ action: 'signin' }` — a SignIn request, which proves an account
 *   without a transaction. No `account`: Xaman says whose it was.
 * - `{ status: uuid }` — where one of this app's requests has got to, as
 *   Xaman reports it: opened, signed, cancelled, expired, the account that
 *   signed, the transaction's id and how its submission went. Only those
 *   fields, never the rest of Xaman's record. It has its own, higher limit,
 *   since a page checks a request more than once.
 *
 * - `account` is the connected address. It goes into the transaction, so
 *   Xaman only lets that account sign.
 * - Every transaction carries MyWeb3's SourceTag, 2357011303 (the helpers
 *   add it).
 * - The answer is Xaman's: the request's id, the link a phone opens, the
 *   code to scan and the live-status socket. No webhook.
 *
 * POST only. 400 for bad input, 429 when rate limited, 502 when Xaman fails,
 * 500 when the keys are not set. `XAMAN_API_KEY` and `XAMAN_API_SECRET` are
 * read from the environment and never leave the server.
 */
import {
  STABLECOINS,
  buildRemoveDomain,
  buildRemoveEmailHash,
  buildSetDomain,
  buildSetEmailHash,
  buildSetTrustline,
  createXamanPayload,
  type Stablecoin,
} from './_lib/xrpl-transactions.js'
import { rateLimited } from './_lib/rate-limit.js'

type Action = 'signin' | 'set_emailhash' | 'remove_emailhash' | 'set_domain' | 'remove_domain' | 'set_trustline'

const ACTIONS: ReadonlySet<string> = new Set<Action>([
  'signin',
  'set_emailhash',
  'remove_emailhash',
  'set_domain',
  'remove_domain',
  'set_trustline',
])

/** A classic address: `r` and 24 to 34 more base58 characters. */
const ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/

/** A Xaman request's id, a UUID. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Status checks a minute per IP: a page checks once a request lands, and every few seconds if its socket drops. */
const STATUS_LIMIT = 60

const XAMAN = 'https://xumm.app/api/v1/platform/payload'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const bad = (error: string) => json(400, { error })

/** The transaction for a request, or why there is none. Throws on a bad value. */
function build(action: Exclude<Action, 'signin'>, value: unknown, account: string) {
  switch (action) {
    case 'set_emailhash':
      if (typeof value !== 'string') throw new Error('value must be a 32-character hash')
      return buildSetEmailHash(value, account)
    case 'remove_emailhash':
      return buildRemoveEmailHash(account)
    case 'set_domain':
      if (typeof value !== 'string') throw new Error('value must be a domain')
      return buildSetDomain(value, account)
    case 'remove_domain':
      return buildRemoveDomain(account)
    case 'set_trustline':
      if (typeof value !== 'string' || !(value in STABLECOINS)) throw new Error('value must be RLUSD or USDC')
      return buildSetTrustline(value as Stablecoin, account)
  }
}

/** The client's IP, as `aws/sign-lambda.ts` passes it on. */
const clientIp = (request: Request) =>
  request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

const tooMany = () => json(429, { error: 'Too many requests. Try again in a minute.' })

const keys = () => {
  const apiKey = process.env.XAMAN_API_KEY
  const apiSecret = process.env.XAMAN_API_SECRET
  return apiKey && apiSecret ? { apiKey, apiSecret } : null
}

const notSetUp = () => json(500, { error: 'Signing is not set up on this server.' })

const returnUrl = () => process.env.XAMAN_RETURN_URL ?? 'https://www.myweb3.me'

interface XamanCreated {
  uuid?: string
  next?: { always?: string }
  refs?: { qr_png?: string; websocket_status?: string }
}

/** Xaman's answer to a new request, as the page needs it. */
const created = (payload: XamanCreated) =>
  json(200, {
    uuid: payload.uuid,
    link: payload.next?.always,
    qr: payload.refs?.qr_png,
    websocket: payload.refs?.websocket_status,
  })

/** A SignIn request: no transaction, no account; Xaman reports who signed. */
async function createSignIn(auth: { apiKey: string; apiSecret: string }): Promise<XamanCreated> {
  const res = await fetch(XAMAN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': auth.apiKey, 'X-API-Secret': auth.apiSecret },
    body: JSON.stringify({ txjson: { TransactionType: 'SignIn' }, options: { return_url: { web: returnUrl() } } }),
  })
  if (!res.ok) throw new Error(`Xaman SignIn failed: ${res.status}`)
  return (await res.json()) as XamanCreated
}

interface XamanRecord {
  meta?: { exists?: boolean; opened?: boolean; resolved?: boolean; signed?: boolean; cancelled?: boolean; expired?: boolean }
  response?: { account?: string | null; txid?: string | null; dispatched_result?: string | null }
}

/** Where a request has got to — only the fields the page acts on. */
async function status(uuid: string): Promise<Response> {
  const auth = keys()
  if (!auth) return notSetUp()
  let res: Response
  try {
    res = await fetch(`${XAMAN}/${uuid}`, { headers: { 'X-API-Key': auth.apiKey, 'X-API-Secret': auth.apiSecret } })
  } catch {
    return json(502, { error: 'Xaman could not be reached.' })
  }
  // 410, not 404: CloudFront serves the app's page for 403 and 404, which the page cannot read.
  if (res.status === 404) return json(410, { error: 'No such request' })
  if (!res.ok) return json(502, { error: 'Xaman could not report the request.' })
  const { meta = {}, response = {} } = (await res.json()) as XamanRecord
  return json(200, {
    opened: Boolean(meta.opened),
    resolved: Boolean(meta.resolved),
    signed: Boolean(meta.signed),
    cancelled: Boolean(meta.cancelled),
    expired: Boolean(meta.expired),
    account: response.account ?? null,
    txid: response.txid ?? null,
    result: response.dispatched_result ?? null,
  })
}

export async function POST(request: Request): Promise<Response> {
  let body: { action?: unknown; value?: unknown; account?: unknown; status?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return bad('Send JSON: { action, value, account }')
  }

  const ip = clientIp(request)
  if (body?.status !== undefined) {
    if (await rateLimited(`status:${ip}`, STATUS_LIMIT)) return tooMany()
    if (typeof body.status !== 'string' || !UUID.test(body.status)) return bad('status must be a request id')
    return status(body.status)
  }

  if (await rateLimited(ip)) return tooMany()

  const { action, value, account } = body ?? {}
  if (typeof action !== 'string' || !ACTIONS.has(action)) return bad('Unknown action')

  if (action === 'signin') {
    const auth = keys()
    if (!auth) return notSetUp()
    try {
      return created(await createSignIn(auth))
    } catch {
      return json(502, { error: 'Xaman could not create the sign request.' })
    }
  }

  if (typeof account !== 'string' || !ADDRESS.test(account)) return bad('account must be an XRPL address')

  let tx
  try {
    tx = build(action as Exclude<Action, 'signin'>, value, account)
  } catch (error) {
    return bad((error as Error).message)
  }

  const auth = keys()
  if (!auth) return notSetUp()

  try {
    return created((await createXamanPayload(tx, { ...auth, returnUrl: returnUrl() })) as XamanCreated)
  } catch {
    // Xaman's own message can carry details of the request; it is not passed on.
    return json(502, { error: 'Xaman could not create the sign request.' })
  }
}

/** Anything but POST is refused. */
const notAllowed = () =>
  new Response(JSON.stringify({ error: 'Use POST' }), {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'application/json' },
  })

export const GET = notAllowed
export const PUT = notAllowed
export const PATCH = notAllowed
export const DELETE = notAllowed
