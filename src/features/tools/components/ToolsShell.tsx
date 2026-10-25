import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SiteShell } from '@/components/layout'
import { useT } from '@/lib/i18n'
import { PATHS } from '@/app/routes'
import myweb3Logo from '@/assets/img/myweb3-extended-white.svg'
import { ToolsMenu } from './ToolsMenu'
import { WalletButton } from './WalletButton'
import { WalletPickerHost } from './WalletPicker'

/**
 * XRPL Tools' frame: the shared `SiteShell` under the MyWeb3.me logo, which is
 * how the Canva heads every page.
 *
 * The logo is the client's header file, `myweb3-extended-white.svg`
 * (2026-10-12), cropped to its artwork and set **228 wide from `sm`** —
 * myweb3.me's own logo's width, which puts its wordmark at theirs, 22 tall
 * (R2, client 2026-10-13). This file's wordmark runs longer against the
 * monogram than myweb3.me's, so set at their 46 height it came out 251 wide
 * and read as larger than the header it is meant to match. 28 tall on a
 * phone, so the bar keeps room for the menu beside it.
 *
 * The header holds the language and the wallet (C1), then — on every page but
 * the hub — the Tools menu at the far right (R13, R24). The directory's
 * currency and rate exist to price things, and nothing here has a price.
 *
 * Every page mounts the one Wallet window here, so a Connect anywhere — the
 * header, a hub tile, an account tool — opens the same window. The footer
 * links the Privacy and Cookies policies (C14).
 */
export function ToolsShell({ children, grow }: { children: ReactNode; grow?: boolean }) {
  const t = useT()
  const { pathname } = useLocation()

  return (
    <SiteShell
      // Hidden from assistive tech — the shell names the link with `brand`,
      // and the logo's own lettering would say it a second time.
      lockup={<img src={myweb3Logo} alt="" aria-hidden className="h-7 w-auto sm:h-auto sm:w-57" />}
      brand={t('tools.brand')}
      home={PATHS.home}
      rights={t('tools.rights', { year: 2027 })}
      links={[
        { to: PATHS.privacy, label: t('legal.privacy') },
        { to: PATHS.cookies, label: t('legal.cookies') },
      ]}
      // The Tools menu last, at the header's far right, everywhere but the
      // hub, which is itself the list of tools (R13, R24).
      settings={(inMenu) => (
        <>
          <WalletButton inMenu={inMenu} />
          {pathname !== PATHS.home && <ToolsMenu inMenu={inMenu} />}
        </>
      )}
      grow={grow}
    >
      {children}
      <WalletPickerHost />
    </SiteShell>
  )
}
