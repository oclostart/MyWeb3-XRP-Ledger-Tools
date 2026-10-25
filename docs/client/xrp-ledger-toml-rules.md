# xrp-ledger.toml Builder: Export Rules

Rules the builder follows when it turns the form into the downloaded file.
Use with `xrp-ledger-template.toml` (field list and order) and
`myweb3-options.json` (dropdown values).

Spec: https://xrpl.org/docs/references/xrp-ledger-toml

1. **File name and encoding.** The download is named `xrp-ledger.toml`, UTF-8.
2. **Section order.** Always METADATA, ORGANIZATION, PRINCIPALS, VALIDATORS, ACCOUNTS, SERVERS, ISSUERS, TOKENS. This is the order in the template.
3. **Entry order.** Entries inside a list section (e.g. 3 PRINCIPALS) stay in the order the user added them.
4. **Brackets.** `[METADATA]` and `[ORGANIZATION]` use single brackets (one per file). Every other section uses double brackets (`[[PRINCIPALS]]`), once per entry.
5. **Empty fields are left out.** A field with no value (empty text or a `-` dropdown) is not written. Never write `name = ""`.
6. **Empty sections are left out.** A section with no filled fields is not written, header included.
7. **Types are not quoted.** Text is in quotes. `true`/`false`, numbers and dates are written without quotes:
   `server_cloud = true`, `network_asn = 16509`, `display_decimals = 2`, `modified = 2027-01-15T00:00:00.000Z`.
8. **`modified` is set at export.** The current time in UTC (RFC 3339, ending in `Z`), set automatically when the user clicks Download.
9. **`expires` must be later than `modified`.** If it isn't, block the download and show an error. It's also UTC and unquoted.
10. **`raid_standard` only when `raid = true`.** Otherwise it's hidden in the form and left out of the file.
11. **`asset_subclass` only when `asset_class` is set.** Otherwise it's hidden in the form and left out of the file.
12. **`display_decimals` is a whole number from 0 to 15.**
13. **`[[TOKENS.URLS]]` follows its token.** Each token's URLs are written directly under that token's `[[TOKENS]]` entry, never grouped at the end.

## Example

```toml
[METADATA]
modified = 2027-01-15T00:00:00.000Z

[ORGANIZATION]
name = "MyWeb3"
website = "https://myweb3.me"

[[TOKENS]]
issuer = "rExampleIssuerAddress"
currency = "USD"
display_decimals = 2
asset_class = "rwa"
asset_subclass = "stablecoin"

[[TOKENS.URLS]]
url = "https://example.com"
type = "website"
title = "Official site"
```
