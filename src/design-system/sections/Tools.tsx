import { useState } from 'react'
import { Section } from '../Section'
import { Button } from '@/components/ui'
import { AtIcon, GlobeIcon, PaperIcon, TagIcon } from '@/components/icons'
import {
  AccountSettingTool,
  SigningWindow,
  ToolTile,
  ToolsMenu,
  WalletButton,
  WalletPicker,
  type Signing,
  type SignStep,
} from '@/features/tools'
import { useT } from '@/lib/i18n'

/** Not a real account — the Canva's sample, which is the point. */
const SAMPLE = { wallet: 'xaman' as const, address: 'rasda7ad71d1877827d171jv3kj2jkkvj1z' }
const noop = () => {}

/** Every step the window shows, each held still for the gallery. */
const SIGN_STEPS: ReadonlyArray<[string, 'xaman' | 'joey', SignStep]> = [
  ['preparing', 'xaman', { step: 'preparing' }],
  ['waiting · Xaman', 'xaman', { step: 'waiting', link: 'https://xumm.app/sign/00000000-demo' }],
  ['opened · Xaman', 'xaman', { step: 'opened', link: 'https://xumm.app/sign/00000000-demo' }],
  ['waiting · Joey', 'joey', { step: 'waiting' }],
  ['cancelled', 'xaman', { step: 'cancelled' }],
  ['failed', 'joey', { step: 'failed' }],
]

/**
 * XRPL Tools' composites, rendered for real. The hub only ever shows one live
 * tile at a time while the tools are being built, so this is where the states
 * sit side by side: live, live but needing a wallet, and not built yet.
 */
export function Tools() {
  const t = useT()
  const [picking, setPicking] = useState(false)
  const [showing, setShowing] = useState<Signing['run']>(null)
  const held: Signing = { run: showing, start: noop, close: () => setShowing(null), retry: noop }

  // The shared props of the account tool, so each state below differs only
  // in what it is demonstrating.
  const domainTool = {
    heading: t('tools.domain.field'),
    label: t('tools.domain.field'),
    placeholder: 'example.com',
    normalise: (input: string) => input.trim() || null,
    holdUntilValid: true,
    currentTitle: t('tools.domain.current'),
    notSet: t('tools.domain.notSet'),
    setLabel: t('tools.domain.set'),
    removeLabel: t('tools.domain.remove'),
    removeTitle: t('tools.domain.removeTitle'),
    removeConfirm: t('tools.domain.removeConfirm', { domain: 'myweb3.me' }),
    onSet: noop,
    onRemove: noop,
    autoFocus: false,
  }

  return (
    <div className="flex flex-col gap-12">
      <Section
        title="ToolTile"
        note="One tool on the XRPL Tools hub. A live tile takes the brand stroke under the pointer, but only its action is pressed and only the action changes the cursor; greyed under Coming soon while the tool is not built."
      >
        <ul className="grid gap-4 sm:grid-cols-3">
          <li>
            <ToolTile
              icon={<TagIcon />}
              title={t('tools.sourceTag.tile')}
              description={t('tools.sourceTag.tileBody')}
              action={t('tools.access')}
              to="/sourcetag"
            />
          </li>
          <li>
            {/* What a signing tool will look like once it is built: the same
                live tile, saying Connect until a wallet is connected. */}
            <ToolTile
              icon={<GlobeIcon />}
              title={t('tools.domain.tile')}
              description={t('tools.domain.tileBody')}
              action={t('tools.connect')}
              to="/"
            />
          </li>
          <li>
            <ToolTile
              icon={<PaperIcon />}
              title={t('tools.toml.tile')}
              description={t('tools.toml.tileBody')}
              action={t('tools.access')}
              soon={t('tools.comingSoon')}
            />
          </li>
        </ul>
        <p className="mt-4 type-caption text-text-subtle">
          The fourth glyph, for Set EmailHash: <AtIcon className="inline size-4 align-text-bottom text-accent-text" />
        </p>
        <div className="mt-4 max-w-xs">
          {/* `onAction` — Connect, which opens the picker in place. */}
          <ToolTile
            icon={<AtIcon />}
            title={t('tools.emailHash.tile')}
            description={t('tools.emailHash.tileBody')}
            action={t('tools.connect')}
            onAction={() => setPicking(true)}
          />
        </div>
      </Section>

      <Section
        title="WalletPicker"
        note="The Wallet window, the narrowest: each wallet's own icon, as supplied, the two side by side 64 apart. While one opens, the line under them names it."
      >
        <Button onClick={() => setPicking(true)}>{t('tools.connect')}</Button>
        <WalletPicker open={picking} onClose={() => setPicking(false)} />
      </Section>

      <Section
        title="ToolsMenu"
        note="The header's Tools menu, at its far right on every page but the hub: the three-bar mark in the language menu's box, and the language list's own rows — the two groups as the hub has them, the page you are on ticked in red. In the phone's menu the list stands open."
      >
        <div className="flex flex-wrap items-start gap-6">
          <ToolsMenu />
          <div className="w-64 rounded-lg border border-border bg-surface-raised p-3">
            <ToolsMenu inMenu />
          </div>
        </div>
      </Section>

      <Section
        title="WalletButton"
        note="The wallet in the header. Not connected: Connect Wallet. Connected: the address's first and last four characters, reading Disconnect with the logout mark under the pointer or keyboard focus, at one width. In the phone's menu: the address as a line and Disconnect as its own button, since a touch screen has no hover."
      >
        <div className="flex flex-wrap items-start gap-6">
          <WalletButton session={null} />
          <WalletButton session={SAMPLE} />
          <div className="w-56">
            <WalletButton session={SAMPLE} inMenu />
          </div>
          <div className="w-56">
            <WalletButton session={null} inMenu />
          </div>
        </div>
      </Section>

      <Section
        title="AccountSettingTool"
        note="One account field, set or removed — Set Domain and Set EmailHash are this with different words. Every state, without a wallet."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <AccountSettingTool {...domainTool} current="" />
          <AccountSettingTool {...domainTool} current="myweb3.me" />
        </div>
      </Section>

      <Section
        title="SigningWindow"
        note="One signature, request to ledger. Each button opens the window held at one step; with Xaman the request shows as a code from sm, and Open in Xaman is the phone's way in."
      >
        <div className="flex flex-wrap gap-3">
          {SIGN_STEPS.map(([name, wallet, step]) => (
            <Button key={name} variant="secondary" onClick={() => setShowing({ session: { ...SAMPLE, wallet }, request: { action: 'remove_domain' }, step })}>
              {name}
            </Button>
          ))}
        </div>
        <SigningWindow signing={held} />
      </Section>
    </div>
  )
}
