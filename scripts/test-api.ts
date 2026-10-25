/**
 * Checks POST /api/sign without a network: Xaman is stood in by a fake fetch.
 * Bad input is refused, each action builds the transaction the client's
 * helpers define (with MyWeb3's SourceTag and the connected account), Xaman's
 * answer is passed on, its failure is a 502, missing keys a 500, and the
 * runbook's test 12 — twenty requests a minute from one IP — gets 429 after
 * ten. Run with `npm run test:api`.
 */
import * as sign from '../api/sign.ts'
import { generateSourceTag } from '../api/_lib/xrpl-transactions.ts'

const ACCOUNT = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
let sent: any = null
let xamanStatus = 200
globalThis.fetch = (async (url: string, init: any) => {
  sent = JSON.parse(init.body)
  if (xamanStatus !== 200) return new Response('nope', { status: xamanStatus })
  return new Response(JSON.stringify({ uuid: 'u-1', next: { always: 'https://xumm.app/sign/u-1' }, refs: { qr_png: 'https://xumm.app/sign/u-1_q.png', websocket_status: 'wss://xumm.app/sign/u-1' } }))
}) as any

let ip = 0
const req = (body: unknown, raw = false) =>
  new Request('https://myweb3.me/api/sign', { method: 'POST', headers: { 'x-real-ip': `10.0.0.${++ip}` }, body: raw ? String(body) : JSON.stringify(body) })
const call = async (body: unknown, raw = false) => { const r = await sign.POST(req(body, raw)); return { status: r.status, body: await r.json() } }
const results: [string, boolean, string][] = []
const check = (name: string, ok: boolean, detail = '') => results.push([name, ok, detail])

process.env.XAMAN_API_KEY = 'k'; process.env.XAMAN_API_SECRET = 's'

check('GET refused', (await sign.GET()).status === 405)
check('bad JSON 400', (await call('{nope', true)).status === 400)
check('unknown action 400', (await call({ action: 'pay', account: ACCOUNT })).status === 400)
check('bad account 400', (await call({ action: 'remove_domain', account: 'xyz' })).status === 400)
check('hash 27 chars 400', (await call({ action: 'set_emailhash', value: 'A'.repeat(27), account: ACCOUNT })).status === 400)
check('hash G-Z 400', (await call({ action: 'set_emailhash', value: 'G'.repeat(32), account: ACCOUNT })).status === 400)
let r = await call({ action: 'set_emailhash', value: 'abcdef0123456789abcdef0123456789', account: ACCOUNT })
check('set_emailhash 200 + tx', r.status === 200 && sent.txjson.EmailHash === 'ABCDEF0123456789ABCDEF0123456789' && sent.txjson.SourceTag === 2357011303 && sent.txjson.Account === ACCOUNT && r.body.link === 'https://xumm.app/sign/u-1' && r.body.qr && r.body.websocket, JSON.stringify(r.body))
r = await call({ action: 'set_domain', value: 'https://Example.com/', account: ACCOUNT })
check('set_domain stores example.com', r.status === 200 && Buffer.from(sent.txjson.Domain, 'hex').toString() === 'example.com', sent.txjson.Domain)
r = await call({ action: 'remove_domain', account: ACCOUNT })
check('remove_domain empty', r.status === 200 && sent.txjson.Domain === '')
r = await call({ action: 'remove_emailhash', account: ACCOUNT })
check('remove_emailhash zeros', r.status === 200 && sent.txjson.EmailHash === '0'.repeat(32))
r = await call({ action: 'set_trustline', value: 'RLUSD', account: ACCOUNT })
check('set_trustline RLUSD', r.status === 200 && sent.txjson.TransactionType === 'TrustSet' && sent.txjson.LimitAmount.issuer === 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De' && sent.txjson.Flags === 0x20000)
check('set_trustline XRP 400', (await call({ action: 'set_trustline', value: 'XRP', account: ACCOUNT })).status === 400)
xamanStatus = 401
check('Xaman fails 502', (await call({ action: 'remove_domain', account: ACCOUNT })).status === 502)
xamanStatus = 200
delete process.env.XAMAN_API_SECRET
check('no keys 500', (await call({ action: 'remove_domain', account: ACCOUNT })).status === 500)
process.env.XAMAN_API_SECRET = 's'
// Runbook test 12: 20 in a minute from one IP gets 429 after the limit.
const same = () => new Request('https://myweb3.me/api/sign', { method: 'POST', headers: { 'x-real-ip': '10.9.9.9' }, body: JSON.stringify({ action: 'remove_domain', account: ACCOUNT }) })
const codes: number[] = []
for (let i = 0; i < 20; i++) codes.push((await sign.POST(same())).status)
check('rate limit: 10 ok then 429', codes.slice(0, 10).every((c) => c === 200) && codes.slice(10).every((c) => c === 429), codes.join(','))
check('SourceTag www.myweb3.me', (await generateSourceTag('www.myweb3.me')) === 2357011303)
check('SourceTag https://MyWeb3.me', (await generateSourceTag('https://MyWeb3.me')) === 2357011303)
for (const [n, ok, d] of results) console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : d)
const passed = results.every((x) => x[1])
console.log(passed ? 'ALL PASS' : 'SOME FAILED')
if (!passed) process.exit(1)
