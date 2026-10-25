import { useRichT, useT } from '@/lib/i18n'
import myweb3Hash from '@/assets/img/myweb3-hash.svg'
import { AccountSettingTool } from './components/AccountSettingTool'
import { AccountToolFrame } from './components/AccountToolFrame'
import { useAccount, useSigning, useWalletSession } from './api/wallet'
import { SigningWindow } from './components/SigningWindow'
import { isMyWeb3Hash, normaliseEmailHash } from './data/accountSet'

/**
 * Set EmailHash (T6, C9): the MyWeb3 Hash on the account's `EmailHash` field,
 * so apps reading the ledger can find the profile behind an address.
 *
 * The field holds exactly 32 hex characters, so that is what the input
 * accepts — which settles the MyWeb3 Hash's shape for every surface that asks
 * for one (OT4).
 *
 * Three states, as the client's Canva has them (2026-10-12):
 * - **not set** — the first line, and where to find a hash;
 * - **set to a hash that is not a MyWeb3 Hash** — the same: the account
 *   carries a hash, but no MyWeb3 profile behind it;
 * - **set to a MyWeb3 Hash** — the line says the account is linked, and the
 *   line on finding a hash goes, since it has been found.
 *
 * Which hash is a MyWeb3 Hash is a stand-in (`isMyWeb3Hash`) until MyWeb3
 * can answer it (H7). Two demo hashes show the two set states:
 * `DEMO_MYWEB3_HASH` and `DEMO_STANDARD_HASH` in `data/accountSet.ts`.
 */
export function ToolsEmailHashScreen() {
  const t = useT()
  const rich = useRichT()
  const session = useWalletSession()
  const account = useAccount(session?.address)
  const signing = useSigning()

  const hash = account.data?.emailHash
  const linked = Boolean(hash && isMyWeb3Hash(hash))

  return (
    <AccountToolFrame
      title={t('tools.emailHash.title')}
      lede={linked ? t('tools.emailHash.ledeSet') : t('tools.emailHash.ledeUnset')}
      // One line, the client's exception (2026-10-13): the linked line runs
      // 696 against the standard 672 and turned over; at `wide`'s 768 both
      // states hold one line.
      measure="wide"
    >
      {(connected) => (
        <>
        <AccountSettingTool
          // The supplied lockup carries the word, as on the directory's
          // Featured form. Set at the height of a window title's line (28) —
          // at 40 it stood 12 taller than the titles beside it (client,
          // 2026-10-12). The space under it is measured to the ink, as the
          // eye reads it (R6, client 2026-10-13): under "Domain" the field
          // sits 16 below the line box, but the letters stop 6 above the box's
          // foot, so 22 shows. The lockup's artwork fills its box, so it takes
          // those 6 as a margin and 22 shows under it too. The title stays
          // for screen readers.
          heading={
            <>
              <img src={myweb3Hash} alt="" aria-hidden className="mb-1.5 h-7 w-auto shrink-0" />
              <span className="sr-only">{t('tools.emailHash.field')}</span>
            </>
          }
          label={t('tools.emailHash.field')}
          placeholder={t('tools.emailHash.field')}
          normalise={normaliseEmailHash}
          invalid={t('tools.emailHash.invalid')}
          current={account.isPending ? undefined : (hash ?? '')}
          currentTitle={t('tools.emailHash.current')}
          notSet={t('tools.emailHash.notSet')}
          setLabel={t('tools.emailHash.set')}
          removeLabel={t('tools.emailHash.remove')}
          removeTitle={t('tools.emailHash.removeTitle')}
          removeConfirm={t('tools.emailHash.removeConfirm')}
          onSet={(value) => signing.start(connected, { action: 'set_emailhash', value })}
          onRemove={() => signing.start(connected, { action: 'remove_emailhash' })}
          // Held back until the account is read, so a linked account never
          // shows the line on finding a hash and then takes it away.
          help={
            linked || account.isPending
              ? undefined
              : rich('tools.emailHash.find', {
                  myweb3: (
                    <a
                      href="https://myweb3.me"
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer text-accent-text transition-ui hover:text-link-hover"
                    >
                      MyWeb3.me
                    </a>
                  ),
                  settings: <strong>{t('tools.emailHash.navSettings')}</strong>,
                  account: <strong>{t('tools.emailHash.navMyAccount')}</strong>,
                  hash: <strong>{t('tools.emailHash.navMyWeb3Hash')}</strong>,
                })
          }
          mono
        />
        <SigningWindow signing={signing} />
        </>
      )}
    </AccountToolFrame>
  )
}
