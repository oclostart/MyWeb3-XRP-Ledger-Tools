import { useCallback, useEffect, useState } from 'react'

/**
 * Copy text, and say so for a moment.
 *
 * Behind `CopyButton`, which every copy mark is. The clipboard is blocked — by
 * a permission, an insecure origin, an embedded browser — often enough that it
 * needs a quiet failure, and keeping that here is how a second copy action
 * never ends up throwing at somebody.
 */
export function useClipboard(resetAfter = 2000) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), resetAfter)
    return () => clearTimeout(id)
  }, [copied, resetAfter])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // The text stays selectable, so failing quietly still leaves a way
      // through — where an error would trap someone over a convenience.
    }
  }, [])

  return { copied, copy }
}
