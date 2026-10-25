import { useSyncExternalStore } from 'react'

/**
 * Whether the Wallet window is open, held outside any one component. Connect
 * Wallet lives in the header, and on a phone the header's controls sit inside
 * a menu that closes when the picker takes the pointer — a picker owned by the
 * button would close with the menu, half-way through choosing. So every
 * Connect — the header's, a hub tile's, an account tool's prompt — opens the
 * one picker `ToolsShell` mounts (`WalletPickerHost`).
 */
let open = false
/** Where to go once a wallet connects — the tool whose Connect opened it. */
let destination: string | undefined
const listeners = new Set<() => void>()

function setOpen(next: boolean) {
  open = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Opens the picker. `then` is a path to go to once a wallet connects: a hub
 * tile's Connect passes its tool, so connecting lands on the tool it was
 * pressed for (client, 2026-10-13) instead of leaving the person on the hub
 * to find it again. The header's Connect passes nothing and stays put.
 */
export const openWalletPicker = (then?: string) => {
  destination = then
  setOpen(true)
}

export const closeWalletPicker = () => {
  destination = undefined
  setOpen(false)
}

/** The path a connection was asked for, once — it is cleared as it is read. */
export function takeDestination(): string | undefined {
  const to = destination
  destination = undefined
  return to
}

export function useWalletPickerOpen(): boolean {
  return useSyncExternalStore(subscribe, () => open, () => false)
}
