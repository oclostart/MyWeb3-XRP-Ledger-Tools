/**
 * About 10 sign requests a minute per IP (the client's runbook §4).
 *
 * The runbook's first choice is a Vercel Firewall rule on `/api/sign`, which
 * needs no code; this is its second, for when the plan has no such rule or as
 * a second line behind it. With `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` set (Upstash's free tier, from the Vercel
 * Marketplace), the count is shared by every running copy of the function.
 * Without them it is counted in memory, per copy — a soft limit, which is why
 * the firewall rule matters.
 *
 * It fails open: if Upstash cannot be reached, the request goes ahead rather
 * than the site refusing everyone.
 */
const LIMIT = 10
const WINDOW_SECONDS = 60

const local = new Map<string, { window: number; count: number }>()

export async function rateLimited(ip: string): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS)
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    const key = `sign:${ip}:${window}`
    try {
      const response = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, String(WINDOW_SECONDS)],
        ]),
      })
      const [first] = (await response.json()) as Array<{ result?: number }>
      return (first?.result ?? 0) > LIMIT
    } catch {
      return false
    }
  }

  const seen = local.get(ip)
  const count = seen && seen.window === window ? seen.count + 1 : 1
  local.set(ip, { window, count })
  return count > LIMIT
}
