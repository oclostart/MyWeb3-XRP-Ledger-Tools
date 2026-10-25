import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Listbox, Popover, type ListboxOption } from '@/components/ui'
import { MenuIcon } from '@/components/icons'
import { LOCALES, useI18n, type Locale } from '@/lib/i18n'
import { useMinWidth } from '@/lib/useMediaQuery'
import { cn } from '@/lib/cn'

/**
 * The frame of a public product site: the product's lockup and its settings,
 * then the page, then the credit line. XRPL.directory and XRPL Tools both stand
 * in it — `DirectoryShell` and `ToolsShell` are each this plus a lockup.
 *
 * Moved out of the directory on 2026-10-06, when XRPL Tools needed the same
 * frame under a different name. It had already been measured against
 * myweb3.me's own nav once; a second copy would have had to be measured again,
 * and would then have drifted.
 *
 * Deliberately not `Header`: that is the signed-in MyWeb3 app's bar, with nav
 * and a profile chip. These are public sites, where nobody is signed in.
 */

/**
 * The nav's measure, and the one `wide` content lines up with.
 *
 * Both have to use it or the promise of `wide` breaks — its whole purpose is
 * that a page's content starts where the lockup above it does.
 */
const NAV_ROW = 'mx-auto w-full max-w-(--container-nav) px-4'

/** Built once — the language list does not change at runtime. */
const LANGUAGE_OPTIONS: ReadonlyArray<ListboxOption<Locale>> = (
  Object.keys(LOCALES) as Locale[]
).map((code) => ({ value: code, label: LOCALES[code].label, flag: LOCALES[code].flag }))

export interface SiteShellProps {
  children: ReactNode
  /**
   * The product's lockup, drawn as a picture only — `brand` is what a screen
   * reader hears. A logo is not translated, which is why the name travels
   * separately rather than as the image's `alt`.
   */
  lockup: ReactNode
  /** The product's name, read in place of the lockup. */
  brand: string
  /** The product's home, which is where the lockup leads. */
  home: string
  /** The footer's ownership line, already translated. */
  rights: string
  /**
   * Pages of the product's own linked from the footer, already translated —
   * the tools' Privacy and Cookies policies. In the footer because that is
   * where anyone looks for them, and it keeps them out of the header's way.
   */
  links?: ReadonlyArray<{ to: string; label: string }>
  /**
   * Settings the product adds after the language picker — the directory's
   * currency and its live rate. `stacked` is true when they sit in the phone's
   * menu, a full-width row each, rather than in the header's own row.
   */
  settings?: (stacked: boolean) => ReactNode
  /**
   * Pins the frame to exactly one viewport instead of at least one, so the
   * page ends where the screen does and the footer is a scroll away rather
   * than a slice taken out of the content's height.
   *
   * The search map asks for this: a map that gives up 150px to a footer is a
   * map with less map in it.
   */
  fill?: boolean
  /**
   * Swaps the centred column for the header's own insets, so the content lines
   * up with the lockup above it instead of sitting in a narrower column of its
   * own.
   *
   * Separate from `fill` because the two are different questions — the search
   * page wants this width in both of its views, but only the map wants the
   * viewport height. It defaults to `fill`, since anything filling the height
   * would look odd still capped in the middle.
   */
  wide?: boolean
  /**
   * Makes the content a column that fills the height between header and
   * footer, so a page can place parts of itself in it — the tools hub keeps
   * its title where every page's title is and centres its tools in the height
   * left below. A page taller than the screen is untouched: there is no spare
   * height to place anything in.
   */
  grow?: boolean
  /**
   * No header, no footer, no padding — the child owns the whole viewport.
   *
   * The map view asks for this. Its chrome moved onto the floating sidebar
   * over the map (the lockup, the search, the filters), so a second bar above
   * it would be the same furniture twice, and a footer would be a strip of
   * nothing under a map that is meant to reach the edges.
   */
  bare?: boolean
}

function SiteHeader({
  lockup,
  brand,
  home,
  settings,
}: Pick<SiteShellProps, 'lockup' | 'brand' | 'home' | 'settings'>) {
  const { t, locale, setLocale } = useI18n()
  const { pathname } = useLocation()
  const inline = useMinWidth('sm')

  /**
   * The header's settings, built once because they have two homes — a row on
   * a desktop, a panel behind the burger on a phone. Two copies is how the
   * two drift.
   */
  const controls = (
    <>
      <Listbox
        label={t('common.language')}
        options={LANGUAGE_OPTIONS}
        value={locale}
        onChange={setLocale}
        className={inline ? undefined : 'w-full'}
      />
      {settings?.(!inline)}
    </>
  )

  return (
    // Scrolls away with the page. It used to stick, so the language, currency
    // and live rate stayed reachable on a page as long as the application
    // form — but a bar that follows the pointer up and down the page is its
    // own kind of noise, and the rate is a reference reading rather than a
    // control anyone reaches for mid-scroll.
    //
    // The gradient stays, and stays full-width — it was there to dissolve
    // content passing underneath rather than cut it at a hard line, so it
    // belongs on the outer band while the row inside takes the measure.
    <header className="bg-gradient-to-b from-canvas via-canvas to-transparent">
      {/* myweb3.me's nav measure: 1420 centred with 16px of padding, so the
          lockup sits 16px from the edge until the viewport outgrows the
          container and then centres with it. Measured off their site at 1440,
          where their logo's left edge lands at 26 — ours sat at 96 under
          `xl:px-24`, which is what made the two headers look unrelated.

          `min-h-20` rather than a fixed height, so the row still wraps on a
          narrow screen instead of overflowing. 80px against their 81. */}
      {/* `min-h-16` on a phone against `min-h-20` from `sm`. The row wraps
          there — the lockup takes one line and the controls the next — so the
          band's own minimum is paying for height the content has already
          claimed, twice over. */}
      <div
        className={cn(
          NAV_ROW,
          'flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3',
          'sm:min-h-20 sm:gap-y-3 sm:py-4',
        )}
      >
        {/* It takes a pointer. This ran `cursor-default` on the argument that
            on the homepage the link leads nowhere — but the header is on every
            screen, and on every other page it is the way back. Withholding the
            cursor to be literal about one route hid the affordance on all the
            others. */}
        <Link
          to={home}
          // On the homepage the route does not change, so `ScrollToTop` never
          // fires and the lockup is a link that visibly does nothing. From down
          // the page, home is the top of it — so that is where it goes.
          onClick={() => {
            if (pathname !== home) return
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
          }}
          className="flex cursor-pointer items-center"
        >
          {lockup}
          <span className="sr-only">{brand}</span>
        </Link>

        {/* Behind a burger below `sm`, spelled out above it.

            Measured at 375 on the directory: the lockup takes 147, and
            language (129) plus currency (119) plus the rate (88) plus the gaps
            come to 360 against 343 of room. Seventeen pixels over, so they
            wrapped to a second row and the rate to a third, and the header
            stood 148 tall before the page had said anything. None of the three
            is what someone came for — they are settings and a reading — so on
            a phone they go behind one control and the header is a lockup and a
            button.

            Rendered one way or the other rather than both with one hidden:
            these are live controls, and two copies would put two language
            pickers in the accessibility tree, each claiming to be the only
            one. */}
        {inline ? (
          <div className="flex flex-wrap items-center gap-3">{controls}</div>
        ) : (
          <Popover label={t('common.menu')} trigger={<MenuIcon />} align="end">
            {/* Stretched, so the settings read as one column rather than
                controls of different widths. */}
            <div className="flex flex-col items-stretch gap-3">{controls}</div>
          </Popover>
        )}
      </div>
    </header>
  )
}

const FOOTER_LINK = 'type-caption cursor-pointer text-accent-text transition-ui hover:text-link-hover'

function SiteFooter({ rights, links }: Pick<SiteShellProps, 'rights' | 'links'>) {
  const t = useI18n().t
  // `py-6`, down from `py-8`. The space above the footer was 40 — the main
  // column's 8 plus the footer's own 32 — and a quarter off that is the
  // footer's padding going to 24. Taken off both ends rather than only the
  // top: a footer standing 24 above its text and 32 below it reads as having
  // slipped down the page.
  return (
    <footer className="flex flex-col items-center gap-1 px-5 py-6 text-center">
      <p className="type-caption text-text-subtle">{rights}</p>
      {links && links.length > 0 && (
        <nav aria-label={t('common.footerLinks')}>
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={FOOTER_LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {/* Leaves the site, so it opens in its own tab — someone reading a
          listing should not lose it to a credit link. `noreferrer` rather than
          just `noopener`: it covers the tab-hijack hole and keeps our URLs out
          of the destination's referrer log.

          The colour shift alone carries the hover; an underline on top of it
          was a second answer to one move. */}
      <a href="https://x.com/OCLostArt" target="_blank" rel="noreferrer" className={FOOTER_LINK}>
        {t('common.poweredBy')}
      </a>
    </footer>
  )
}

export function SiteShell({
  children,
  lockup,
  brand,
  home,
  rights,
  links,
  settings,
  fill = false,
  wide = fill,
  grow = false,
  bare = false,
}: SiteShellProps) {
  // `data-shell` lets the stylesheet give back the scrollbar's room: a page
  // pinned to the window never scrolls, so the kept gutter would be an empty
  // strip down the map's right edge.
  if (bare)
    return (
      <div data-shell="bare" className="h-svh w-full overflow-hidden">
        {children}
      </div>
    )

  return (
    <div className={cn('flex flex-col', !fill && 'min-h-screen')}>
      {/* Filling wraps the header and the content in exactly one viewport and
          leaves the footer outside it, so the map ends where the screen does
          and the footer is a scroll away rather than a slice taken out of the
          map's height. `contents` dissolves this box when not filling, so the
          ordinary layout is unchanged — header, main and footer stay direct
          children of the one flex column. */}
      <div className={cn(fill ? 'flex h-svh flex-col' : 'contents')}>
        <SiteHeader lockup={lockup} brand={brand} home={home} settings={settings} />
        {/* Only a token pad here. Sections carry their own bottom spacing and
            the footer carries its own top, so a large pad on `main` was a
            third gap stacked between the two — 104px of nothing under the
            last listing.

            `wide` takes the header's own measure, so the content lines up
            with the lockup above it instead of sitting in a narrower
            column. */}
        <main
          className={cn(
            'w-full flex-1',
            fill && 'flex min-h-0 flex-col',
            grow && 'flex flex-col',
            wide ? NAV_ROW : 'mx-auto max-w-wide px-4 md:px-5',
            // The footer carries its own top spacing; this is the token pad
            // that keeps the last row off it. A filling page has no gap to
            // close — its content ends at the fold.
            !fill && 'pb-2',
          )}
        >
          {children}
        </main>
      </div>
      <SiteFooter rights={rights} links={links} />
    </div>
  )
}
