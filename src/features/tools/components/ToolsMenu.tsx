import { Link, useLocation } from 'react-router-dom'
import { Popover } from '@/components/ui'
import { CheckIcon, MenuIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import { PATHS } from '@/app/routes'
import { useWalletSession } from '../api/wallet'
import { TOOL_GROUPS } from '../data/tools'

/**
 * The header's Tools menu (R13, R24 — client 2026-10-13): every tool a click
 * away from any page but the hub, which already lists them.
 *
 * **The three-bar mark, at the header's far right, made as the language
 * menu is**: the trigger is the language picker's own box — field grey, the
 * same stroke, the brand red under the pointer — holding `MenuIcon`, and the
 * list is the language list: 4 of padding, rows in the body size on the brand
 * plate under the pointer, and the page you are on ticked in red, as the
 * chosen language is. Each tool's glyph is in the brand red, as on its hub
 * tile (client, 2026-10-14). The two groups stand as the hub has them, each under its
 * name in small capitals. It opened from a "Tools" word before the language
 * menu for a day; the client asked for the mark, and for it last.
 *
 * In the phone's menu (`inMenu`) the list stands open: a dropdown inside the
 * burger's panel is one layer too many to thumb through.
 */
export function ToolsMenu({ inMenu = false }: { inMenu?: boolean }) {
  const t = useT()
  const { pathname } = useLocation()
  const session = useWalletSession()

  const list = (
    <nav aria-label={t('tools.menu')} className="flex flex-col gap-1">
      {TOOL_GROUPS.map((group) => (
        <div key={group.key} className="flex flex-col gap-1">
          <p className="px-3 pt-2 pb-1 type-micro text-text-subtle uppercase">{t(`tools.groups.${group.key}`)}</p>
          <ul className="flex flex-col gap-1">
            {group.tools.map((tool) => {
              if (!tool.route) return null
              const to = PATHS[tool.route]
              const here = pathname === to
              // `Listbox`'s option: 8 tall padding, 12 in, the tick 8 from
              // the right.
              const row = 'flex items-center gap-2 rounded-md py-2 pr-2 pl-3 whitespace-nowrap type-body [&_svg]:size-4 [&_svg]:shrink-0'
              const content = (
                <>
                  {/* Each tool's glyph in the brand red, as on its hub tile
                      (client, 2026-10-14) — white on the brand plate under
                      the pointer, where red would vanish. */}
                  <span aria-hidden className="flex text-accent-text transition-ui group-hover:text-text-on-accent">
                    {tool.icon}
                  </span>
                  <span className="flex-1">{t(`tools.${tool.key}.tile`)}</span>
                  <CheckIcon
                    aria-hidden
                    className={cn('text-accent-text group-hover:text-text-on-accent', here ? 'opacity-100' : 'opacity-0')}
                  />
                </>
              )
              return (
                <li key={tool.key}>
                  {/* A tool that signs waits for a wallet: greyed out, as the
                      language list greys an option it cannot take, and not a
                      link (client, 2026-10-14). The hub's Connect is the way
                      in; the page itself no longer asks to connect. */}
                  {tool.signs && !session ? (
                    <span aria-disabled="true" className={cn(row, 'cursor-not-allowed text-text opacity-30')}>
                      {content}
                    </span>
                  ) : (
                    <Link
                      to={to}
                      aria-current={here ? 'page' : undefined}
                      className={cn(
                        row,
                        'group cursor-pointer text-text transition-ui hover:bg-accent hover:text-text-on-accent',
                      )}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  if (inMenu) return list

  return (
    <Popover label={t('tools.menu')} trigger={<MenuIcon />} body="list" align="end">
      {list}
    </Popover>
  )
}
