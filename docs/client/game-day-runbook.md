# MyWeb3.me XRPL Tools: Game Day Runbook (Vercel)

Step-by-step plan to build and launch the tools during the hackathon.
Written so a partner developer can follow it without extra context.

**Tools:** Generate SourceTag, Generate xrp-ledger.toml, Set Domain, Set EmailHash, Set Stablecoin Trust Lines (RLUSD / USDC)
**Hosting:** Vercel (website + one serverless function). Domain registered at Bluehost.
**Network:** XRP Ledger Mainnet only
**Wallets:** Xaman, Joey (via WalletConnect)
**Database:** none. Nothing is logged. Infrastructure: `myweb3-tools-infrastructure.txt`.

---

## 0. Before game day (prep that is usually allowed)

Check the hackathon rules first. Do only what the rules allow before the event, and disclose anything built earlier.

- [ ] GitHub account + empty repo `myweb3-tools`; partner dev added as collaborator
- [ ] Vercel account, logged in with GitHub. Check the plan: Hobby is free but **non-commercial only**; use Pro if needed
- [ ] Bluehost login for `myweb3.me` (to edit DNS records)
- [ ] Xaman developer app at https://apps.xumm.dev: API key + secret saved somewhere safe; return URL `https://myweb3.me`
- [ ] WalletConnect project ID from https://cloud.reown.com
- [ ] Installed locally: Node.js 20+, Git, Vercel CLI (`npm i -g vercel`)
- [ ] A Mainnet test wallet in Xaman with at least ~13 XRP (base reserve + 2 trust lines + fees)
- [ ] Design files ready:
  - Canva screens (exported images or share link)
  - `myweb3-options.json` (language, toml dropdowns, countries)
  - `xrp-ledger-template.toml`, `xrp-ledger-toml-rules.md`
  - `xrpl-transactions.ts`
  - Logos: `myweb3-extended-white.svg` (header), `myweb3-logo-black.svg` (favicon), `xrp-ledger-white.svg`

---

## 1. Project setup (≈30 min)

```
myweb3-tools/
├── api/
│   └── sign.ts                     # the only backend: Xaman sign requests
├── public/
│   ├── myweb3-logo-black.svg       # favicon
│   └── ...logos
├── src/
│   ├── data/myweb3-options.json
│   ├── lib/xrpl-transactions.ts
│   └── ...pages
├── vercel.json
└── package.json                    # React + Vite (or Next.js)
```

- [ ] Create the app (`npm create vite@latest`, React + TypeScript) and the folders above
- [ ] Copy in `xrpl-transactions.ts`, `myweb3-options.json`, the toml template and rules, the logos
- [ ] Push to GitHub, then in Vercel: **Add New → Project → import the repo**. Every push now deploys automatically, and every pull request gets its own preview link.

---

## 2. Backend: one function, `api/sign.ts` (≈1 hour)

It does one thing: **build the transaction on the server and create a Xaman sign request.**

### Security rule (important)
**Never accept a full transaction from the browser.** The browser sends only the inputs.
The function validates them and builds the transaction itself with `xrpl-transactions.ts`.
Otherwise anyone could use your Xaman key to create sign requests for any transaction.

### Request
`POST /api/sign` with JSON `{ action, value, account }`

| action | value | builder |
|---|---|---|
| `set_emailhash` | 32-hex hash | `buildSetEmailHash` |
| `remove_emailhash` | none | `buildRemoveEmailHash` |
| `set_domain` | domain | `buildSetDomain` |
| `remove_domain` | none | `buildRemoveDomain` |
| `set_trustline` | `RLUSD` or `USDC` | `buildSetTrustline` |

- `account` = the connected wallet address. Put it in the transaction so Xaman only lets that account sign
  (otherwise the user could sign with a different account than the one shown on the site).
- Every transaction includes MyWeb3's SourceTag `2357011303` (the builders add it).

It returns what Xaman returns: `uuid`, `next.always` (deep link), `refs.qr_png` (QR image),
`refs.websocket_status` (live status for the signing popup). No webhook needed.

- [ ] Write the handler: validate input → pick builder → `createXamanPayload`
- [ ] Read `XAMAN_API_KEY` / `XAMAN_API_SECRET` from `process.env`, never from code
- [ ] Only accept `POST`; return 400 for bad input, 429 when rate limited, 502 if Xaman fails

---

## 3. Secrets (≈5 min)

Vercel → Project → **Settings → Environment Variables** (Production + Preview):

| Name | Value | Visible to browser? |
|---|---|---|
| `XAMAN_API_KEY` | from apps.xumm.dev | No |
| `XAMAN_API_SECRET` | from apps.xumm.dev | **No, never** |
| `VITE_WALLETCONNECT_PROJECT_ID` | from cloud.reown.com | Yes (that's fine) |

- [ ] Only variables starting with `VITE_` (or `NEXT_PUBLIC_`) reach the browser. The Xaman ones must not have that prefix.
- [ ] Redeploy after adding variables.

---

## 4. Rate limit on `/api/sign` (≈30 min)

Backend only. A frontend limit can be skipped, so it doesn't protect the Xaman key.

- [ ] Limit: about **10 requests per minute per IP**
- [ ] Option A: Vercel → **Firewall → add a rate-limit rule** on path `/api/sign` (check it's available on your plan)
- [ ] Option B: Upstash Redis (free tier, via Vercel Marketplace) + `@upstash/ratelimit` inside `api/sign.ts`
- [ ] Frontend (UX only): disable the Set button while a request is open

---

## 5. `vercel.json` (≈10 min)

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- The rewrite makes page refreshes work in a single-page app. Real files (logos, favicon) are served before rewrites.
- Not needed if you use Next.js (it handles routing itself).

---

## 6. Frontend build (bulk of the work)

Build in this order. Ship what is done, cut from the bottom.

1. [ ] Home page: 5 tool cards. Signed out: Access (browser tools) / Connect (wallet tools). Signed in: all Access, address + Disconnect on hover
2. [ ] Wallet connect with **Xaman** and **Joey** (xrpl-connect), Mainnet. Stay connected after refresh (save the address); clear it on Disconnect
3. [ ] Read current EmailHash / Domain / trust lines from a public Mainnet node (`account_info`, `account_lines`)
4. [ ] Signing popup: QR + deep link, live status, success (tx link), cancelled/failed + Try again
5. [ ] **Set EmailHash**: not set / MyWeb3 hash (blue link) / other hash (gray, "Not linked to a MyWeb3 profile."), Remove with confirmation
6. [ ] **Set Domain**: not set / set, Remove with confirmation, link to the toml tool
7. [ ] **Generate SourceTag** (browser only), Copy shows "Copied", Reset, GitHub discussion link
8. [ ] **xrp-ledger.toml builder**: steps, live preview, Download, Reset confirmation (follow `xrp-ledger-toml-rules.md`)
9. [ ] **Trust Lines**: RLUSD + USDC cards, Set or ✓ per card, 0.2 XRP reserve note
10. [ ] Language dropdown (from `myweb3-options.json`)

- [ ] Keep `xrp-ledger.toml` on one line in the toml card (`white-space: nowrap`)
- [ ] Favicon: `myweb3-logo-black.svg`

---

## 7. Domain: Bluehost → Vercel (≈15 min, plus DNS wait)

- [ ] Vercel → Project → **Settings → Domains** → add `myweb3.me` and `www.myweb3.me`
- [ ] Vercel shows the exact DNS records (an **A** record for `myweb3.me`, a **CNAME** for `www`)
- [ ] Bluehost → Domains → DNS → add/replace those records
  - Use the records, **not** a nameserver change, if email or anything else runs on this domain, so you don't break it
- [ ] Wait until Vercel shows **Valid Configuration** (minutes to a few hours). HTTPS is issued automatically.
- [ ] Do this early so DNS has time to update

---

## 8. Test on Mainnet with a real wallet (≈1–2 hours)

Test on a **preview link** first, then on `myweb3.me`. Each test costs a tiny XRP fee.

| # | Test | Expected |
|---|---|---|
| 1 | Connect Xaman on desktop (QR) and phone (deep link) | Address shows; refresh keeps you connected; Disconnect works |
| 2 | Set EmailHash with a valid 32-hex hash | Signs; ledger shows it; tx has SourceTag 2357011303 |
| 3 | EmailHash with 27 chars / letters G–Z | Set stays disabled, error shown |
| 4 | Remove EmailHash | Confirmation shown, field removed |
| 5 | Set Domain `https://Example.com/` | Stored as `example.com`, displays correctly |
| 6 | Remove Domain | Field removed |
| 7 | Set RLUSD trust line | Card switches to ✓; USDC still shows Set |
| 8 | Sign with a different account in Xaman than the one connected | Xaman refuses (Account is set) |
| 9 | Cancel a request in Xaman | "Transaction cancelled" + Try again |
| 10 | SourceTag for `myweb3.me` | `2357011303` |
| 11 | Build a toml with every section, download | Named `xrp-ledger.toml`, valid TOML, empty fields left out, `modified` set |
| 12 | Hit `/api/sign` 20 times in a minute | Gets 429 after the limit |
| 13 | Mobile layout | Cards stack, everything usable |

- [ ] Check one transaction on an explorer (search the tx hash) and confirm the SourceTag
- [ ] Run the generated toml through a TOML validator

---

## 9. Go live (≈15 min)

- [ ] Merge to `main` → Vercel deploys to production automatically
- [ ] Re-run tests 1, 2 and 7 on `https://myweb3.me`
- [ ] Watch Vercel → **Logs** for errors in the first hour

---

## 10. Hackathon submission

- [ ] Architecture diagram
- [ ] Short demo video: connect wallet → Set EmailHash → Set Domain → Set a trust line → build toml
- [ ] README: what it does, how it's hosted (Vercel + Xaman + XRPL), how to run locally, what was built during the event
- [ ] Live URL and repo link

---

## If things go wrong

| Problem | Likely fix |
|---|---|
| Domain shows "Invalid Configuration" | DNS records at Bluehost don't match what Vercel shows, or DNS hasn't updated yet |
| 404 when refreshing a page | Missing rewrite in `vercel.json` (Vite) |
| `/api/sign` returns 500 | Env vars missing or added after the last deploy; redeploy |
| Xaman returns 401/403 | Wrong key/secret in Vercel env vars |
| Xaman secret visible in the browser | It has a `VITE_` / `NEXT_PUBLIC_` prefix; rename it, rotate the secret in apps.xumm.dev |
| Trust line fails to sign | Account doesn't have enough XRP for the 0.2 XRP reserve |
| Anything badly broken | Vercel → Deployments → pick the last good one → **Promote to Production** (instant rollback) |
