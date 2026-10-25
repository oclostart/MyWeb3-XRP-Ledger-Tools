# Architecture

How the code is organised, and the two boundaries that keep it that way as
features pile up.

## Layout

```
src/
  main.tsx                    Entry. Mounts the app, imports global styles.
  app/                        Application shell — wiring only, no UI.
    App.tsx                   Resolves the current route.
    routes.tsx                The route table.
  features/                   One folder per product area. Self-contained.
    tools/
      Tools*Screen.tsx        One screen per tool, and the hub.
      components/             Composites only the tools use.
      data/                   The tools' data and domain logic.
      api/                    The wallet and the ledger.
      index.ts                Its public surface. Other code imports THIS.
  components/
    ui/                       Design-system primitives. The vocabulary.
    layout/                   App chrome — SiteShell.
    icons/                    Generated from src/assets/icons. Do not edit.
    flags/                    Generated from country-flag-icons. Do not edit.
  design-system/              The gallery. Documentation, not shipped UI.
  lib/                        Shared utilities with no domain knowledge.
  styles/                     tokens.css, typography.css, base styles.
  assets/                     Source SVGs and images.
    data/                     Supplied data the forms read — the client's
                              options file.
    wallets/                  Supplied wallet icons, shown as given.
    tokens/                   Supplied token marks.

api/                          Vercel functions — POST /api/sign.
public/                       Served as-is: the favicon.
docs/                         Rules, language, registry, this file.
  client/                     The client's package, as supplied.
scripts/                      Icon codegen and the design-system checker.
```

## Adding a feature

```
src/features/<name>/
  <Name>Screen.tsx
  components/        only if it needs composites of its own
  data/
  index.ts           export the screen and anything others may use
```

Then register it in `src/app/routes.tsx`. That is the whole ceremony.

## The two boundaries

**1. Features compose; they never invent.**

A feature may import from `@/components/ui`, `@/components/layout`,
`@/components/icons`, `@/components/flags` and `@/lib`. Nothing else under
`@/components`.

If a feature needs a primitive the system lacks, it goes into
`components/ui/`, the gallery and the registry first — then the feature uses
it. A one-off inside a feature is a future inconsistency with a delayed fuse.

**2. Features do not reach into each other.**

`@/features/other` — the barrel — is fine. `@/features/other/data/thing` is
not. Going through the barrel keeps each feature's internals free to move.

Both are enforced by `scripts/check-design-system.mjs` and fail the build.

## Where a component belongs

| It is... | It lives in |
|---|---|
| Reusable across features, no domain knowledge | `components/ui/` |
| Chrome present on every screen | `components/layout/` |
| A composite only one feature uses | `features/<name>/components/` |
| Generated from an exported asset | `components/icons/` or `components/flags/` |

`ToolTile` is the worked example: it composes `Card` and `buttonVariants`,
but it only means anything on the tools hub, so it lives in the feature rather
than the design system.

## Styles

`styles/tokens.css` owns colour, type, spacing, radii and motion for the whole
app — it is the only file allowed a colour literal.

A feature may keep a stylesheet for **layout tokens it owns**. Dimensions only: the
checker holds every stylesheet to whole even pixels, and flags a colour literal
anywhere outside `tokens.css`.

## The gallery is the one exception

`design-system/` may import from a feature, because documenting a composite
means rendering the real thing. Nothing else gets that latitude.
