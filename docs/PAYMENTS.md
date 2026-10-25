# Opus Zimbabwe payments

The standalone checkout is `/payments/` on the main site and on `payments.opuszim.co.zw` once DNS/TLS validation completes. The subdomain root redirects to `/payments/`. Both use the same Pages Functions, D1 ledger and Pesepay merchant application.

## Required production configuration

In Cloudflare → Workers & Pages → **opuszimbabwe** → Settings → Variables and Secrets, add these **encrypted Production secrets** from the Pesepay merchant application:

- `PESEPAY_INTEGRATION_KEY`
- `PESEPAY_ENCRYPTION_KEY` (the exact 32-character merchant encryption key)

Never use `NEXT_PUBLIC_` names, paste keys into chat, or commit them. Redeploy after changing production secrets. Checkout disables initiation until both secrets are present and the encryption key has the expected shape. Key validity/merchant activation still require an actual gateway transaction.

The Pages project has been requested to serve `payments.opuszim.co.zw`. In the domain's DNS provider add:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | payments | opuszimbabwe.pages.dev |

Keep the existing main-site/MX records. The available project token cannot list or edit the DNS zone; DNS and certificate validation must complete before using the subdomain. Main-site `/payments/` works independently of this DNS step.

## Flow and reconciliation

- This checkout collects an **invoice/project payment** for the amount/currency agreed with the customer. It does not calculate an outstanding balance, mark an invoice fully paid, fulfil a service, or create subscriptions automatically.
- Currencies/local methods/minimums/maximums are loaded from Pesepay's public API, filtered to supported local methods. As observed during implementation, USD exposes EcoCash, InnBucks, Zimswitch and Omari; ZiG exposes EcoCash and PayGo. Do not promise OneMoney/ZIPIT until Pesepay exposes/enables them for the applicable currency/merchant. Merchant settlement configuration remains in Pesepay.
- PayPal, Visa and Mastercard show the requested unavailable overlay. The initiation endpoint independently rejects international method codes. The hosted provider receives the selected local method code, skipping its initial method picker. Keep international methods disabled in merchant settings as well if that hosted application offers users alternative methods.
- Payment method is chosen before any details. The supplied wordmarks appear without repeated visible names; the Opus logo is centred. InnBucks, Zimswitch, Omari and other hosted methods collect authorisation details on Pesepay. Name/email are optional receipt fields.
- EcoCash/OneMoney require a mobile number and use Pesepay seamless mobile requests when the provider does not require a hosted redirect. Numbers normalise from +263/00263/263 to local format. OneMoney accepts 071; EcoCash accepts 077/078/079; full national length is 10 digits. Validation runs both in the browser and against the actual server-selected gateway method. Omari has no operator-prefix restriction. OneMoney only appears when Pesepay supplies an active method for that currency.
- Pesepay handles authorisation/payment. Opus never collects card numbers, PINs or CVVs. Existing local-payment marketing logos remain admin managed and separate from gateway availability.
- A server-reserved attempt with a hashed access token prevents concurrent duplicate initiations. Ambiguous initiation failures remain UNCONFIRMED and cannot be automatically charged again under the same attempt. Customers should contact support with their reference.
- Return URLs contain an opaque receipt capability, not payer data; it is moved into tab session storage and removed from the visible URL when storage works. Documents use `Referrer-Policy: no-referrer` and deny framing. Receipt APIs require that capability and do not expose email/phone/token hashes.
- Notifications require the integration key via Pesepay's documented Authorization header and are treated only as a signal. `checkPayment` independently verifies the reference, amount and currency. Repeated callbacks cannot create another payment; delayed success cannot overwrite a reversal. Partial payments do not display success.
- Polling provides recovery if a callback is delayed. Callback result URL: `/api/payments/webhook`; return URL: `/payments/?payment=…&token=…`. Both are generated from the validated checkout origin. Configure/allow these HTTPS URLs in the merchant application if required.
- The admin's **Customer Payments** tab shows the latest 100 records behind the existing Cloudflare Access protection. Each row offers an explicit read-only **Verify with Pesepay** action to recover missed notifications or check for reversals. Receipts show the gateway-confirmed customer payable amount, with the invoice amount separately when they differ. Pesepay remains the source for fees, net settlement and full accounting reports.

## Checks and launch

`node scripts/test-payments.cjs` expects the handlers bundled first:

```sh
node_modules/.bin/esbuild functions/api/payments/create.ts functions/api/payments/status.ts functions/api/payments/webhook.ts functions/api/payments/config.ts --outbase=functions --outdir=/tmp/opus-payments-test --bundle --platform=node --format=cjs
node scripts/test-payments.cjs
```

These tests use temporary in-memory SQLite and an encrypted fake gateway. Browser checks: `scripts/test-payment-checkout.cjs` using local Pages and Playwright. Neither test sends a real payment request. Runtime uses the official pinned `pesepay@2.0.0` SDK with Cloudflare fetch and TLS verification; it does not retry charges or follow arbitrary poll/redirect URLs.

After secrets/DNS are configured, verify available methods and the callback/return URLs, then arrange an explicitly authorised small real payment with the merchant/customer. No real charge was made during implementation. Don't report end-to-end merchant acceptance or settlement until a real authorised transaction is confirmed.

Primary contact: support@opuszim.co.zw. Secondary: opuszimbabwe@outlook.com. Direct contact/WhatsApp: 0710 740 387. Support only: 0773 979 162.
