import { Link } from 'react-router-dom'
import { useRichT, useT } from '@/lib/i18n'
import { PATHS } from '@/app/routes'
import { AccountSettingTool } from './components/AccountSettingTool'
import { AccountToolFrame } from './components/AccountToolFrame'
import { useAccount, useSigning, useWalletSession } from './api/wallet'
import { SigningWindow } from './components/SigningWindow'
import { normaliseDomainInput } from './data/accountSet'

const LINK = 'cursor-pointer text-accent-text transition-ui hover:text-link-hover'

/**
 * Set Domain (T5): the domain on the account's `Domain` field, set and
 * removed through the wallet. The line under the title points at the toml
 * builder, because a domain on an account proves nothing until the file at
 * that domain names the account back.
 *
 * Set waits for a domain or a website, as SourceTag's Generate does, and
 * what is signed is the bare domain — `https://www.example.com/` signs
 * `example.com` (client, 2026-10-19).
 *
 * Once set, the line names the domain in the ledger-value blue (C5, C8) — as
 * text, not a link: the client asked for it not to lead anywhere.
 */
export function ToolsDomainScreen() {
  const t = useT()
  const rich = useRichT()
  const session = useWalletSession()
  const account = useAccount(session?.address)
  const signing = useSigning()

  const domain = account.data?.domain
  const toml = (
    <Link to={PATHS.toml} className={LINK}>
      {t('tools.domain.toml')}
    </Link>
  )

  return (
    <AccountToolFrame
      title={t('tools.domain.title')}
      lede={
        domain
          ? rich('tools.domain.ledeSet', {
              domain: <span className="break-all text-value">{domain}</span>,
              toml,
            })
          : rich('tools.domain.ledeUnset', { toml })
      }
    >
      {(connected) => (
        <>
        <AccountSettingTool
          heading={t('tools.domain.field')}
          label={t('tools.domain.field')}
          placeholder="example.com"
          normalise={normaliseDomainInput}
          holdUntilValid
          current={account.isPending ? undefined : (domain ?? '')}
          currentTitle={t('tools.domain.current')}
          notSet={t('tools.domain.notSet')}
          setLabel={t('tools.domain.set')}
          removeLabel={t('tools.domain.remove')}
          removeTitle={t('tools.domain.removeTitle')}
          removeConfirm={t('tools.domain.removeConfirm')}
          onSet={(value) => signing.start(connected, { action: 'set_domain', value })}
          onRemove={() => signing.start(connected, { action: 'remove_domain' })}
        />
        <SigningWindow signing={signing} />
        </>
      )}
    </AccountToolFrame>
  )
}
