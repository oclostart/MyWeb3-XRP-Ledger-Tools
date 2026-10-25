# Ledger integration

How the tools sign with a Ledger hardware wallet. The code is
`src/features/tools/api/ledgerWallet.ts`; the window that asks for USB or
Bluetooth is in `src/features/tools/components/WalletPicker.tsx`.

## At a glance

```
browser ── USB (WebHID) or Bluetooth (Web Bluetooth) ──► Ledger device, XRP app
   │
   └── fill + submit ──► XRP Ledger public node (xrplcluster.com, fallback s1.ripple.com)
```

No server is involved: the page builds the transaction, the device signs it
and the page submits it. The private key never leaves the device.

## Libraries

Ledger's official open-source libraries, loaded only when Ledger is chosen:

| Package | Version | What it does |
|---|---|---|
| `@ledgerhq/hw-app-xrp` | 6.38.0 | Talks to the device's XRP app: get the address, sign a transaction |
| `@ledgerhq/hw-transport-webhid` | 6.36.0 | The USB link |
| `@ledgerhq/hw-transport-web-ble` | 6.35.0 | The Bluetooth link |
| `@ledgerhq/hw-transport` | 6.36.1 | The shared transport type |
| `ripple-binary-codec` | 2.11.0 | XRPL's own encoder: the transaction in the binary form the device signs |

The libraries expect Node's `Buffer`, which a browser lacks; the page adds it
before they load.

## Documentation used

- Ledger developer portal: https://developers.ledger.com
- Ledger's JavaScript libraries (source and README for each package):
  https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs
- XRP app API (`getAddress`, `signTransaction`):
  https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-xrp
- XRPL transactions (AccountSet, TrustSet) and common fields:
  https://xrpl.org/docs/references/protocol/transactions
- XRPL `submit`, `fee`, `account_info`, `tx` methods:
  https://xrpl.org/docs/references/http-websocket-apis
- Browser APIs: WebHID (https://developer.mozilla.org/docs/Web/API/WebHID_API)
  and Web Bluetooth (https://developer.mozilla.org/docs/Web/API/Web_Bluetooth_API)

## Requirements

- Chrome or Edge on a computer, or Chrome on Android. Safari and iOS give
  pages no USB or Bluetooth; the window then says to use Chrome or Edge.
- The XRP app installed and open on the device (through Ledger Live).
- The account activated on Mainnet (funded with the XRP reserve).
- Account path `44'/144'/0'/0/0`: the first XRP account, the one Ledger
  Live shows as XRP 1.

## Connecting

1. The person picks Ledger in the Wallet window, then USB or Bluetooth (only
   the links this browser offers are shown). The libraries start loading as
   soon as Ledger is picked, because the browser lets a page ask for a device
   only right after a click.
2. The browser shows its own device chooser; the person picks the Ledger.
   Over USB, a device already allowed is reused without asking again.
3. The page asks the XRP app for the address, with confirmation on: the
   person checks the address on the device screen and approves.
4. The address is kept in the browser (`localStorage`) as the session, with
   the link it came over.

## Signing

1. The page builds the transaction from the same helpers Xaman's server uses
   (AccountSet for Domain and EmailHash, TrustSet for RLUSD and USDC), with
   MyWeb3's SourceTag, 2357011303.
2. It asks the device for the address again: a different Ledger, or a
   different account, is refused before anything is signed.
3. It fills in what the ledger needs, read from Mainnet:
   - `Sequence` from `account_info`
   - `Fee` from `fee` (the higher of base and open-ledger fee), refused above
     1000 drops (0.001 XRP)
   - `LastLedgerSequence` = current ledger + 20 (about 80 seconds)
   - `SigningPubKey` from the device
4. `ripple-binary-codec` encodes it; the device shows the transaction and the
   person approves it on screen.
5. The signed blob goes to the ledger with `submit`. A `tef`, `tem` or `tel`
   result means the ledger never took it, and the window says it failed.
6. Like every wallet here, it counts as done only once `tx` shows it in a
   validated ledger with `tesSUCCESS`; then the page reads the account again.

Rejecting on the device (status `0x6985`, or `0x5501` on newer firmware)
shows as Cancelled, with Try again.

## Status

Built with Ledger's official libraries and the XRPL references above. Not yet
run on a physical device: no Ledger was available for testing (2026-10-25).
