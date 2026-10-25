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

### Verified live EcoCash test — 25 October 2026

The owner explicitly authorised exactly one USD0.10 request. Pesepay accepted it,
the owner confirmed receipt of the trusted phone prompt, and independent gateway
status subsequently reported SUCCESS. No additional test request was sent.
No PIN was collected or stored. Private payment access tokens remain outside Git.

Initiation failures now record bounded, secret-redacted diagnostic codes/messages
in the authenticated Customer Payments ledger. Ambiguous responses never cause an
automatic second charge. Domain orders use server-owned USD amounts and legal
customer identities; successful verification starts the separately tracked registrar
workflow. Payment success alone is never shown as proof of domain registration.

### Shareable receipts

A successful receipt displays a grey Opus Verified stamp. Download receipt and
Share receipt first request the protected, no-store payment status endpoint; only
SUCCESS can generate a stamped image. Export uses the actual bundled Poppins font,
Opus branding, paid amount, payer when supplied, reference and Africa/Harare time.
No email address, phone, access token or domain-owner address is embedded.

The PNG can be attached to WhatsApp/Messenger. Browsers supporting native file
sharing can open their share sheet; others download the image and explain how to
attach it. Cancelling native sharing does not send a message or initiate payment.
Print receipt remains available, including the watermark, for printing/save-as-PDF.
The downloaded receipt is a static record; subsequent reversals are checked on
live status/export. No external message is automatically sent by these controls.

### Admin receipt email and domain receipt contacts — 25 October 2026

Domain checkout now records a receipt email and optional WhatsApp number separately
from legal registrant details and the mobile-money authorisation number. The
customer can use the registrant email or choose a different receipt email. Contact
information is private; it does not appear in public catalogue responses or shared
receipt data. Existing orders fall back to their recorded email for admin review.

Admin → Customer Payments or Domains & Pricing → Verified receipt prepares a new
receipt only after a fresh, strict Pesepay reference/amount/currency/status check.
Receipt verification does not initiate registration or another payment. The admin
reviews/changes the recipient, then explicitly clicks Send verified receipt by
email. Download/share uses the existing stamped Poppins PNG. WhatsApp opens a
customer-addressed draft; it does not automatically send a message.

Email uses Resend. Configure these encrypted Production Pages secrets:

- `RESEND_API_KEY`: sending and sent-email status read access.
- `RECEIPT_FROM_EMAIL`: e.g. `Opus Zimbabwe <receipts@opuszim.co.zw>`.

Verify the sending domain in Resend first, following its provided DNS records.
Keep the existing receiving inbox/Zoho MX records. Replies go to
support@opuszim.co.zw. The site does not use Zoho Mail SMTP for transactional email.
No API key is entered in browser forms or committed to Git.

The email includes the canonical branded receipt and a private 90-day receipt link.
The browser receipt uses Poppins and a grey Opus Verified watermark; recipients can
download/share PNG or print/save PDF. Email clients render the HTML stamp according
to their supported typography/CSS. The receipt link is a hashed-capability grant,
separate from the original payment capability. Tokens are removed from the browser
URL when session storage works, never embedded in the receipt image, and never
stored in plaintext in D1. Each view/export re-verifies the payment; a reversal or
mismatch blocks the verified receipt. Payment success and domain registration
state are shown separately.

Resend acceptance is recorded as ACCEPTED, not as inbox delivery. Admin can read
the provider's current status (DELIVERED, BOUNCED, etc.). Receipt recipient, issuing
admin, timestamps, provider reference and recent email history are recorded.
A conditional D1 send lock plus provider idempotency key prevents duplicate sends
for the same receipt attempt. Ambiguous send outcomes become UNCONFIRMED and are
not retried automatically; check the provider before preparing another email.
A draft never sends by itself. Missing sender configuration disables the send
button and fails closed on the server. This receipt-specific record is separate
from the proposed project maintenance/log/report system, which remains unbuilt.
