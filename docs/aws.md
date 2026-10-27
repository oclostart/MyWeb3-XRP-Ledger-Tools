# AWS setup

How www.myweb3.me runs. Everything is on AWS; Vercel is no longer part of it.

## At a glance

```
visitor ── https://www.myweb3.me ──► CloudFront (CDN, HTTPS)
                                        │
                     every path ────────┼──► S3 bucket (the built site)
                                        │
                     /api/* ────────────┴──► Lambda "myweb3tools-sign" ──► Xaman Platform API
                                              (POST /api/sign)

browser ──► XRP Ledger public node (reads, Ledger submissions)
browser ──► WalletConnect relay ──► Joey Wallet app
browser ──► Ledger device (USB / Bluetooth)
```

Only Xaman's requests touch our server. Account reads, Joey and Ledger go
straight from the browser to the XRP Ledger, WalletConnect or the device.

## Account and region

| | |
|---|---|
| Account | 325058822998 ("Lost Art") |
| Region | us-east-1 (N. Virginia) |
| Sign-in | AWS SSO, CLI profile `myweb3-tools` (`aws sso login --profile myweb3-tools`) |
| Tag | `Project=myweb3-tools` on every resource |

## The pieces

### S3 — the site

- Bucket `myweb3tools-site-325058822998`: the output of `npm run build` (`dist/`).
- Private: public access blocked. Only CloudFront can read it, through
  Origin Access Control.
- Files in `assets/` have hashed names and are cached for a year;
  `index.html` is never cached, so a deploy shows up at once.

### CloudFront — the front door

- Distribution `E23F1OQWJKEELT` (`d1m48od7yutvbu.cloudfront.net`), alias
  `www.myweb3.me`, HTTP redirected to HTTPS, TLS 1.2 or newer.
- Certificate in ACM (us-east-1) for `www.myweb3.me` and `myweb3.me`.
- Two routes:
  - `/api/*` → the Lambda function's URL, with the `x-origin-verify` header
    (see below). Not cached.
  - everything else → the S3 bucket.
- 403 and 404 from S3 are answered with `index.html` and 200, so a deep link
  or a refresh (`/domain`, `/trustlines`, …) reaches the app. For this reason
  the API answers an unknown request with 410, not 404.

### Lambda — `/api/sign`

- Function `myweb3tools-sign`: Node.js 22, arm64, 1024 MB, 10 s timeout.
- Code: `api/sign.ts`, wrapped by `aws/sign-lambda.ts`, bundled into one
  `index.mjs` by the deploy.
- Reached through a Function URL (auth `NONE`), but it refuses any request
  without the right `x-origin-verify` header. Only CloudFront sends it, so
  the function answers only through www.myweb3.me.
- The visitor's IP is taken from CloudFront's `cloudfront-viewer-address`,
  never from the visitor's own headers, for the rate limit.
- What it does: creates Xaman sign-in and sign requests (it builds the
  transaction itself, from `{ action, value, account }`) and reports their
  status. The API is described in the README.

**Environment variables** (set on the function, never in the repository):

| Name | What | Secret |
|---|---|---|
| `XAMAN_API_KEY` | Xaman app "MyWeb3.me", apps.xumm.dev | Yes |
| `XAMAN_API_SECRET` | same | **Yes, never in the browser** |
| `ORIGIN_VERIFY` | random value CloudFront sends as `x-origin-verify` | Yes |
| `XAMAN_RETURN_URL` | optional; `https://myweb3.me` if unset | No |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | optional; not set today | Yes |

**Rate limit:** 10 sign requests and 60 status checks a minute per IP,
counted in memory per running copy of the function (Upstash, if set, shares
the count across copies).

**Logs:** CloudWatch log group `/aws/lambda/myweb3tools-sign`. Only AWS's own
start/end/duration lines and errors; the function logs no addresses or
request content.

### DNS — Bluehost

DNS stays at Bluehost (no nameserver change):

| Record | Points to |
|---|---|
| `www.myweb3.me` CNAME | `d1m48od7yutvbu.cloudfront.net` |
| `myweb3.me` | Bluehost, 301 redirect to `https://www.myweb3.me/` |

## Deploys

`.github/workflows/deploy.yml` runs on every push to `main` (and by hand):

1. `npm ci`, lint, build, `npm run test:api`
2. Bundle `/api/sign` into `sign-lambda.zip`
3. Sign in to AWS with GitHub OIDC (no stored AWS keys)
4. Upload `dist/` to S3 (assets first, `index.html` last)
5. Invalidate CloudFront
6. Update the Lambda code and wait for it

The role is `myweb3tools-site-deploy`; it trusts only this repository's `main`
branch. No person signs in to AWS for a deploy: GitHub Actions presents an
OIDC token and the role's trust policy checks its subject. The repository
issues the immutable form of that subject (`use_immutable_subject`), which
carries the owner's and the repository's numeric IDs, and the trust policy
matches on those IDs with the name wildcarded:

```
repo:oclostart@114838175/*@1432896925:ref:refs/heads/main
```

So renaming the repository cannot break deploys again — the rename of
2026-10-25 did, because the policy then named `MyWeb3.me-Tools` literally, and
every deploy failed with `Not authorized to perform sts:AssumeRoleWithWebIdentity`
until 2026-10-27. Two things would still break it, both deliberate acts:
transferring the repository to another owner (new owner ID), or turning the
immutable subject off (`gh api repos/oclostart/MyWeb3-XRP-Ledger-Tools/actions/oidc/customization/sub`).
Either way, the fix is this one condition on the role.

Repository settings (Settings → Secrets and variables → Actions):

| Kind | Name |
|---|---|
| secret | `AWS_ROLE_ARN` |
| variable | `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `SIGN_FUNCTION_NAME` |

**Branches:** feature branch → PR to `dev` → PR `dev` → `main`. Merging into
`main` is shipping; it deploys by itself.

## Common tasks

Check the live function:

```bash
aws lambda get-function --function-name myweb3tools-sign --profile myweb3-tools \
  --query 'Configuration.[LastModified,State]'
```

Read the last hour of logs:

```bash
aws logs tail /aws/lambda/myweb3tools-sign --since 1h --profile myweb3-tools
```

Rotate the Xaman key: create a new key/secret at apps.xumm.dev, then Lambda →
`myweb3tools-sign` → Configuration → Environment variables. No redeploy needed.

Roll back: revert the commit on `main` (PR from `dev`) and the deploy runs again.

## Not set up (yet)

- AWS WAF in front of CloudFront — the function's own rate limit is the only
  limit today.
- CloudFront access logs.
- A retention period on the Lambda log group (kept forever by default).
