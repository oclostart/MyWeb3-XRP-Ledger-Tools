/**
 * Runs api/sign.ts on AWS Lambda, behind CloudFront's /api/* route: turns
 * the request into a web `Request`, calls the handler for its method, and
 * passes the `Response` back.
 *
 * Two things a hosting platform would otherwise do are done here:
 * - The function is reachable only through the site. CloudFront sends
 *   `x-origin-verify` with a secret the function holds (`ORIGIN_VERIFY`);
 *   a request without it is refused, so nobody calls the function URL direct.
 * - `x-real-ip` is the visitor's address, set from CloudFront's
 *   `cloudfront-viewer-address`, never taken from the visitor's own headers.
 */
import * as sign from '../api/sign.js'

interface FunctionUrlEvent {
  rawPath: string
  rawQueryString: string
  headers: Record<string, string | undefined>
  body?: string
  isBase64Encoded: boolean
  requestContext: { http: { method: string } }
}

interface FunctionUrlResult {
  statusCode: number
  headers: Record<string, string>
  body: string
}

const handlers: Record<string, (request: Request) => Response | Promise<Response>> = {
  POST: sign.POST,
  GET: sign.GET,
  PUT: sign.PUT,
  PATCH: sign.PATCH,
  DELETE: sign.DELETE,
}

const plain = (statusCode: number, body: string): FunctionUrlResult => ({
  statusCode,
  headers: { 'Content-Type': 'text/plain' },
  body,
})

/** `1.2.3.4:443` or `[2001:db8::1]:443` → the address alone. */
const viewerIp = (address: string | undefined): string | undefined =>
  address?.replace(/^\[?(.*?)\]?:\d+$/, '$1')

export async function handler(event: FunctionUrlEvent): Promise<FunctionUrlResult> {
  const secret = process.env.ORIGIN_VERIFY
  if (!secret || event.headers['x-origin-verify'] !== secret) return plain(403, 'Forbidden')
  if (event.rawPath !== '/api/sign') return plain(404, 'Not Found')

  const method = event.requestContext.http.method
  const run = handlers[method]
  if (!run) return plain(405, 'Method Not Allowed')

  const headers = new Headers()
  for (const [name, value] of Object.entries(event.headers)) {
    if (value !== undefined && name !== 'x-origin-verify' && name !== 'x-real-ip') headers.set(name, value)
  }
  const ip = viewerIp(event.headers['cloudfront-viewer-address'])
  if (ip) headers.set('x-real-ip', ip)

  const hasBody = event.body !== undefined && method !== 'GET' && method !== 'HEAD'
  const query = event.rawQueryString ? `?${event.rawQueryString}` : ''
  const request = new Request(`https://${event.headers.host ?? 'localhost'}${event.rawPath}${query}`, {
    method,
    headers,
    body: hasBody ? Buffer.from(event.body ?? '', event.isBase64Encoded ? 'base64' : 'utf8') : undefined,
  })

  const response = await run(request)
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  }
}
