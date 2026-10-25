# MyWeb3.me Tools — working agreement

A set of XRP Ledger tools under the MyWeb3.me brand: Generate SourceTag,
Generate xrp-ledger.toml, Set Domain, Set EmailHash and Set Stablecoin Trust
Lines. Launched at a hackathon on `myweb3.me`, on AWS, until the full
MyWeb3 app takes that address; then the tools move to `tools.myweb3.me`.

**Dark-only** — no light theme, no `dark:` variant, no theme switch. The build
fails on `dark:`.

Before building anything, check `docs/feature-list.md`. If it is not listed
there, it is not agreed — add it first. The client's own spec is in
`docs/client/`: the game-day runbook, the infrastructure, the transaction
helpers, the toml template and rules.

Read both before writing any UI:

- `docs/design-system.md` — the rules the build enforces.
- `docs/design-language.md` — the judgement behind them.

## The one rule that matters

**Screens compose from the design system. They never invent.**

If a screen needs something the system does not have, the work is:
1. Add or extend the component in `src/components/ui/`
2. Add it to the gallery in `src/design-system/sections/`
3. Register it in `docs/component-registry.md`
4. *Then* use it in the screen

Check `docs/component-registry.md` before creating any component. A new
**variant** on an existing component is almost always the right answer.

## Layout

```
api/                         The server function — /api/sign, run on Lambda by aws/.
src/app/                     Routing, entry.
src/features/tools/          The tools. Self-contained.
src/features/legal/          The Privacy and Cookies policies, in MyWeb3.me's words.
src/components/ui/           Design-system primitives. The vocabulary.
src/components/layout/       App chrome — SiteShell.
src/design-system/           Gallery, at /design-system in development only.
src/styles/tokens.css        Design tokens. The ONLY file with colour literals.
docs/feature-list.md         The agreed inventory.
docs/client/                 The client's package, as supplied.
```

Two boundaries, both enforced by the build:

1. **Features compose, never invent.** A feature imports only from
   `@/components/ui`, `@/components/layout`, `@/components/icons`, `@/lib`.
2. **Features do not reach into each other.** Import `@/features/other`, never
   `@/features/other/data/thing`.

## Secrets

`XAMAN_API_KEY` and `XAMAN_API_SECRET` live in the Lambda function's environment
and are read only by `api/`. They never take a `VITE_` prefix — anything with
one is shipped to the browser. `VITE_WALLETCONNECT_PROJECT_ID` is public by
design. Nothing secret is committed.

## Verify before claiming done

```bash
npm run lint && npm run build
```

`npm run build` runs the design-system checker first and fails on violations.
When `api/` changes, also run `npm run test:api`.

The dev server is `myweb3-tools` in `.claude/launch.json`, on port 5174 so it
can run beside MW3's on 5173.

## Shipping

`main` is production: a push to `main` deploys to AWS
(`.github/workflows/deploy.yml`) by itself, with no gate after it.

Work goes on `dev` and is checked locally. Merging `dev` into `main` is the
act of shipping, and it happens only when the founder approves it.

**Commits are authored as `malikhaseebtariq`.** `user.email` is set
repo-locally to that account's GitHub noreply address, overriding a global
identity that belongs to a second account. Never change or override it.

## History

The repository keeps its real history. The tools were first built inside the
MW3 app from 2026-10-06 and lifted into this repository on 2026-10-12; the
README lists what existed before the hackathon and what was built during it.
Never rewrite dates or history to say otherwise.
