/**
 * The boundary between this frontend and the backend.
 *
 * Every network call goes through `request`. Today `USE_FIXTURES` is on and
 * feature modules resolve local data instead; when the API lands, flip the
 * flag and the feature modules call `request` — no screen changes, because no
 * screen imports data directly.
 *
 * The shapes each endpoint must satisfy are written up in
 * `docs/api-contract.md` for whoever builds the backend.
 */

export const USE_FIXTURES = true

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    throw new ApiError(res.status, `${init?.method ?? 'GET'} ${path} failed with ${res.status}`)
  }

  return res.json() as Promise<T>
}

/** A page of results. Every list endpoint returns this shape. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}

/**
 * Fixtures resolve instantly, which hides every loading state and lets us ship
 * screens that flash or jump the moment a real network is involved. A small
 * delay keeps those states honest while we build against local data.
 */
export function fixtureDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
