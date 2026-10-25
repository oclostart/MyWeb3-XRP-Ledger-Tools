/**
 * POST /api/sign — the site's only backend (H10, the client's runbook §2).
 *
 * It does one thing: build the transaction on the server and create a Xaman
 * sign request for it. **The browser never sends a transaction**, only
 * `{ action, value, account }`; the transaction is built here with the
 * client's helpers, so nobody can use MyWeb3's Xaman key to ask for a
 * signature on anything else.
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

type Action = 'set_emailhash' | 'remove_emailhash' | 'set_domain' | 'remove_domain' | 'set_trustline'

const ACTIONS: ReadonlySet<string> = new Set<Action>([
  'set_emailhash',
  'remove_emailhash',
  'set_domain',
  'remove_domain',
  'set_trustline',
])

/** A classic address: `r` and 24 to 34 more base58 characters. */
const ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const bad = (error: string) => json(400, { error })

/** The transaction for a request, or why there is none. Throws on a bad value. */
function build(action: Action, value: unknown, account: string) {
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

/** The client's IP, as Vercel passes it on. */
const clientIp = (request: Request) =>
  request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

export async function POST(request: Request): Promise<Response> {
  if (await rateLimited(clientIp(request))) return json(429, { error: 'Too many requests. Try again in a minute.' })

  let body: { action?: unknown; value?: unknown; account?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return bad('Send JSON: { action, value, account }')
  }

  const { action, value, account } = body ?? {}
  if (typeof action !== 'string' || !ACTIONS.has(action)) return bad('Unknown action')
  if (typeof account !== 'string' || !ADDRESS.test(account)) return bad('account must be an XRPL address')

  let tx
  try {
    tx = build(action as Action, value, account)
  } catch (error) {
    return bad((error as Error).message)
  }

  const apiKey = process.env.XAMAN_API_KEY
  const apiSecret = process.env.XAMAN_API_SECRET
  if (!apiKey || !apiSecret) return json(500, { error: 'Signing is not set up on this server.' })

  try {
    const payload = (await createXamanPayload(tx, {
      apiKey,
      apiSecret,
      returnUrl: process.env.XAMAN_RETURN_URL ?? 'https://myweb3.me',
    })) as {
      uuid?: string
      next?: { always?: string }
      refs?: { qr_png?: string; websocket_status?: string }
    }
    return json(200, {
      uuid: payload.uuid,
      link: payload.next?.always,
      qr: payload.refs?.qr_png,
      websocket: payload.refs?.websocket_status,
    })
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
