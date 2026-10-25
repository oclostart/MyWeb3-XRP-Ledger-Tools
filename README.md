# MyWeb3.me Tools

XRP Ledger tools under the MyWeb3.me brand: Generate SourceTag, Generate
xrp-ledger.toml, Set Domain, Set EmailHash and Set Stablecoin Trust Lines.
React, Vite and TypeScript on AWS, with one server function that creates
Xaman sign requests. XRP Ledger Mainnet only. No database; nothing is logged.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | |
|---|---|
| `npm run dev` | Dev server. The design-system gallery is at `/design-system` |
| `npm run build` | Design-system check, type-check, production build |
| `npm run lint` | Linter plus the design-system checker |
| `npm run test:api` | Checks `/api/sign` with Xaman stood in: input checks, the transactions, errors, the rate limit |

## Pages

| Path | |
|---|---|
| `/` | The tools: one card each |
| `/sourcetag` | Generate SourceTag — in the browser, nothing sent |
| `/xrp-ledger-toml` | Build and download an xrp-ledger.toml — in the browser |
| `/domain` | Set or remove the account's Domain — signs with the wallet |
| `/emailhash` | Set or remove the account's EmailHash — signs with the wallet |

## Deploying on AWS

Everything runs on AWS (us-east-1): the site in S3 behind CloudFront, and
`/api/sign` on Lambda behind the same distribution's `/api/*` route.

1. **Deploys** — a push to `main` runs `.github/workflows/deploy.yml`: lint,
   build, `test:api`, then the site to S3, a CloudFront invalidation, and the
   function's new code to Lambda. GitHub signs in to AWS through OIDC; the
   repository holds the role (`AWS_ROLE_ARN`) and the names (`AWS_REGION`,
   `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `SIGN_FUNCTION_NAME`), never keys.
2. **Environment variables** — on the Lambda function, not in the repository:

   | Name | Where it comes from | Reaches the browser? |
   |---|---|---|
   | `XAMAN_API_KEY` | apps.xumm.dev | No |
   | `XAMAN_API_SECRET` | apps.xumm.dev | **No, never** |
   | `ORIGIN_VERIFY` | a random secret CloudFront also sends, so the function answers only through the site | No |
   | `XAMAN_RETURN_URL` | optional — where Xaman sends people after signing; `https://myweb3.me` if unset | No |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | optional — Upstash, for a rate limit shared by every copy of the function | No |

   `VITE_WALLETCONNECT_PROJECT_ID` (cloud.reown.com) is public by design and
   built into the page; the code carries the project's ID when it is unset.
3. **Rate limit** — the function limits itself to about 10 requests a minute
   per IP: shared through Upstash when its two variables are set, per running
   copy otherwise.
4. **Domain** — `www.myweb3.me` is a CNAME at Bluehost to the CloudFront
   distribution, with its certificate in ACM; `myweb3.me` redirects to it.
   CloudFront answers any path that is not a file with `index.html`, so a deep
   link or a refresh reaches the app.

## The server function

`POST /api/sign` takes `{ action, value, account }` — `set_emailhash`,
`remove_emailhash`, `set_domain`, `remove_domain` or `set_trustline` — builds
the transaction itself with the client's helpers (`api/_lib/xrpl-transactions.ts`),
and creates the Xaman sign request. It answers `{ uuid, link, qr, websocket }`:
the link a phone opens, the code to scan and the live-status socket. It never
accepts a transaction from the browser. 400 bad input, 429 rate limited,
502 Xaman failed, 500 keys not set.

## History

The tools were first built inside the MW3 app (XRPL.directory's repository)
from 2026-10-06, then lifted into this repository on 2026-10-12. Built before
the hackathon: SourceTag, the xrp-ledger.toml builder, Set Domain and Set
EmailHash on a stand-in wallet, and the design system. The hackathon work is
listed in `docs/feature-list.md`, section H.
