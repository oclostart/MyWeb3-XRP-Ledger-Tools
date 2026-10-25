/**
 * An XRPL address cut to its ends — `rp5E…XDpe` — for a place with room for
 * a reminder of which account is connected rather than the whole of it: the
 * header's wallet pill (client, 2026-10-12, first four and last four).
 *
 * Where someone checks an address before acting on it, show it whole; this is
 * the label, never the value.
 */
export function shortAddress(address: string, keep = 4): string {
  if (address.length <= keep * 2 + 1) return address
  return `${address.slice(0, keep)}…${address.slice(-keep)}`
}
