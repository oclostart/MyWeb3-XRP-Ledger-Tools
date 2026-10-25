import { useQuery } from '@tanstack/react-query'
import { TRUST_LINE_RESERVE_XRP } from '../data/trustLines'

/**
 * Reads straight off the XRP Ledger, through a public node — no wallet, no
 * account.
 *
 * `xrplcluster.com` because it answers a page's own request: it sends
 * `Access-Control-Allow-Origin: *`, where Ripple's `s1` and `s2` refuse a
 * browser outright (checked 2026-10-19). It is a cluster of full-history
 * servers behind one address, on Mainnet, the only network the tools use.
 */
const NODE = 'https://xrplcluster.com/'

/** XRP is a million drops. */
const DROPS_PER_XRP = 1_000_000

/**
 * The owner reserve — what each object an account owns, a trust line among
 * them, holds back — from the last validated ledger, in XRP. `server_state`
 * gives it in whole drops (`reserve_inc`), where `server_info`'s XRP figure is
 * a float.
 */
async function readOwnerReserve(signal: AbortSignal): Promise<number> {
  const response = await fetch(NODE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'server_state', params: [{}] }),
    signal,
  })
  if (!response.ok) throw new Error(`server_state answered ${response.status}`)
  const body = (await response.json()) as { result?: { state?: { validated_ledger?: { reserve_inc?: unknown } } } }
  const drops = body.result?.state?.validated_ledger?.reserve_inc
  if (typeof drops !== 'number' || !Number.isFinite(drops) || drops < 0) throw new Error('No reserve in server_state')
  return drops / DROPS_PER_XRP
}

/**
 * The reserve a trust line holds, as the ledger has it now (client,
 * 2026-10-19): validators vote the reserves, so a figure written into the page
 * would go stale the day they change. Read once a visit and kept for an hour.
 *
 * Until the answer lands, or if the node cannot be reached, it is the value
 * the ledger has held since December 2024 — 0.2 XRP — so the line under the
 * boxes is never empty and never jumps.
 */
export function useTrustLineReserve(): number {
  const { data } = useQuery({
    queryKey: ['tools', 'ledger', 'ownerReserve'],
    queryFn: ({ signal }) => readOwnerReserve(signal),
    staleTime: 60 * 60 * 1000,
    retry: 1,
    placeholderData: TRUST_LINE_RESERVE_XRP,
  })
  return data ?? TRUST_LINE_RESERVE_XRP
}
