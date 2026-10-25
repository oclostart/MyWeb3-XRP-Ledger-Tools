/**
 * Deterministic SourceTag — the method proposed in XRPL-Standards discussion
 * #577, "Ecosystem Idea: Deterministic Source Tag" (Lost Art, 2026-07-05).
 *
 * A domain is normalised, hashed with SHA-256, and the digest's first 4 bytes
 * are read as a big-endian unsigned 32-bit integer — the width of the ledger's
 * SourceTag field.
 *
 * Implemented to the letter of the proposal, not to taste. Its whole value is
 * that every implementation agrees: a friendlier normalisation here — dropping
 * a trailing slash, say — would hand someone a tag no other tool produces for
 * the same input, which is the problem the proposal exists to solve.
 */
export const SOURCE_TAG_PROPOSAL = 'https://github.com/XRPLF/XRPL-Standards/discussions/577'

/**
 * The proposal's step 1: lowercase, trim, then one scheme prefix and then one
 * `www.` — in that order, and nothing else.
 */
export function normaliseDomain(input: string): string {
  let normalized = input.toLowerCase().trim()
  if (normalized.startsWith('https://')) normalized = normalized.slice(8)
  else if (normalized.startsWith('http://')) normalized = normalized.slice(7)
  if (normalized.startsWith('www.')) normalized = normalized.slice(4)
  return normalized
}

export interface SourceTagResult {
  /** Exactly what was hashed. Shown back, because it is the proof of the number. */
  domain: string
  tag: number
}

/**
 * Steps 2–4: SHA-256 over the UTF-8 bytes, then the first 4 bytes big-endian.
 *
 * `null` when nothing is left after normalising, so a caller cannot hash an
 * empty string and present the result as somebody's tag. `crypto.subtle` needs
 * a secure context, which https and localhost both are.
 */
export async function deriveSourceTag(input: string): Promise<SourceTagResult | null> {
  const domain = normaliseDomain(input)
  if (!domain) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(domain))
  return { domain, tag: new DataView(digest).getUint32(0, false) }
}
