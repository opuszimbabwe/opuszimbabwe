# Opus Zimbabwe — domain provider setup

Requested goal: sell/register and manage customer domains, with local payments collected through Opus and Zimbabwean domain enquiries handled by support/WhatsApp. The chosen route is registering through Cloudflare Registrar for the extensions Cloudflare supports, rather than claiming independent ICANN accreditation.

## What is already verified

- The existing Cloudflare account/project serves the Opus website and payment checkout.
- Cloudflare's official September 2026 Registrar API documentation supports domain search, real-time availability/pricing checks and programmatic registration, including an inline customer registrant contact.
- **Registrar API access verified on 25 October 2026:** extension-schema lookup, registration listing, legacy domain listing and live availability checks all return HTTP 200 with success=true.
- The owner confirmed completion of the registrant-contact/agreement and supplier-billing prerequisites and added **Registrar: Domains: Admin** without removing the existing permissions. Billing/contact completion is owner-confirmed; no billable registration was used as a test.
- Read-only verification correctly reports `cloudflare.com` as unavailable and `opuszim.co.zw` as `extension_not_supported`. Zimbabwean domain enquiries remain with Opus by email/WhatsApp.
- The account currently lists zero domain registrations. Domain registration/management is available through the Cloudflare account; this is not a claim of independent ICANN accreditation or enrolment in a separately contracted reseller programme.
- No domain has been purchased or transferred as part of this setup. No accreditation or reseller approval has been claimed.

## Account prerequisites (owner confirmed complete)

1. Open **Domain Registration → Register Domains** in the account used for the Opus site: https://dash.cloudflare.com/?to=/:account/domains/registrations . Configure the default registrant contact using the business's accurate legal name and physical address, and review/accept the Domain Registration Agreement in the dashboard. Do not use invented legal details.
2. Under **Billing → Payment info**, configure a valid default payment method. Cloudflare states that this billing setup cannot be completed through the Registrar API. Opus customers paying locally through Pesepay does not itself fund Cloudflare's supplier billing account.
3. Create or extend an API token with the required account-scoped **Registrar read/write permissions**. Keep it private. An API integration token should be stored as an encrypted backend secret, never in NEXT_PUBLIC variables, browser code or chat. Existing deployment/admin protection secrets must be preserved.
4. For a customer-owned domain, use that customer's authorised registrant details rather than making Opus the default owner of every customer's domain. Keep renewal, transfer and ownership terms clear before collecting a registration payment.
5. Check the exact desired domain's live availability and price, obtain the customer's approval/payment and then register that exact domain. Cloudflare registration is billable and non-refundable; no unspecified domain should be bought merely to enable the account.

Cloudflare Registrar remains the registrar of record. Using its dashboard/API does not make Opus an independently accredited registrar. If the desired goal is full ICANN accreditation, that is a different application with legal, financial and contractual requirements; it must be prepared separately after confirming that goal and the business details.

## Reviewable customer workflow

1. Customer searches an international domain. Use Registrar API Check as the source of live availability/pricing; never label arbitrary names available.
2. Unsupported extensions and Zimbabwean domains go to support@opuszim.co.zw / direct WhatsApp 0710 740 387 for an availability enquiry and quote.
3. Present the registration/renewal costs and Opus's service charge, ownership details and expiry of the quote. Do not describe Cloudflare as supporting all global extensions.
4. Collect the agreed amount with the verified Pesepay checkout. A successful payment does not by itself mean a domain was registered.
5. Recheck availability/price immediately before the supplier purchase, then register once using a server-controlled order/payment reference. Handle unavailable domains or supplier failures explicitly; do not silently substitute a name or charge again.
6. Show “registered” only after Cloudflare confirms the registration workflow succeeded. Retain the renewal date, customer ownership/contact details and registration reference.

## Official references

- Registrar API prerequisites and workflow: https://developers.cloudflare.com/registrar/registrar-api/
- Current API reference and supported extensions: https://developers.cloudflare.com/api/resources/registrar/
- Register a domain in the dashboard: https://developers.cloudflare.com/registrar/get-started/register-domain/
- Independent registrar accreditation: https://www.icann.org/resources/pages/accreditation-2012-02-25-en

The official guide and API reference currently describe differing beta/extension limits. Use the live extension/check response for the specific requested name; premium and unsupported extensions must not be assumed registrable through the API.

## Website catalogue and automatic registrations (25 October 2026)

The website now lists the 423 extensions returned by the account’s Registrar API.
407 have a standard USD catalogue price; 16 require an enquiry. Eligibility,
premium names and live availability are checked separately for every order.
Local Zimbabwean extensions remain enquiries by email/WhatsApp.

Retail pricing is supplier cost plus 25%, with a minimum US$5 gross markup,
rounded up to cents, for both initial registration and the current renewal quote.
Admin → Domains & Pricing controls this rule. This is markup on cost, before
payment fees and operating costs, not a guaranteed net margin. Existing orders
retain their agreed quote; new orders recheck supplier and retail prices.

Encrypted Pages runtime secrets `CLOUDFLARE_REGISTRAR_TOKEN` and
`CLOUDFLARE_REGISTRAR_ACCOUNT_ID` supply account-scoped access. Their values
must never be committed or included in browser code. Existing Access and Pesepay
secrets are preserved. Use a dedicated Registrar-only token when rotating access.

Customer flow: live domain check → legal registrant and eligibility details →
explicit domain/price consent → 15-minute USD quote → local Pesepay payment →
independent amount/currency/reference verification → once-only registration.
The inline registrant contact is the customer, not the account’s default owner.
One year is purchased, auto-renew is off, and eligible contact data is redacted.
The customer may still need to verify their registrant email or registry eligibility.

A unique active-domain reservation prevents different orders charging for the same
name concurrently. A conditional D1 lock precedes the one supplier purchase.
Registrar timeouts are checked using GET registration/status endpoints only;
there is no automatic repeat purchase. The site distinguishes payment success
from confirmed registration. Price changes, action-required and failed registration
need support resolution; they do not prompt another payment. Reversed payments
are flagged and cannot silently complete another registration.

Renewals are quoted for information and remain managed through the registrar
account; the current Registrar API beta does not offer automated renewal. This
integration does not confer ICANN accreditation or formal reseller-program status.

Refresh the catalogue periodically (read-only, no purchases):

```bash
python3 scripts/refresh-domain-catalogue.py
npx wrangler d1 execute opuszim-content --remote --file=/tmp/opus-domain-import.sql
```

The script reads environment credentials and writes private temporary wholesale
snapshots under `/tmp`; do not publish these. Quotes always check live prices even
when a catalogue snapshot is older. Domain order/contact records are private;
public catalogue responses contain retail prices only.

Validation: isolated SQLite/encrypted Pesepay and Registrar mocks cover exact
prices, ownership, capabilities, consent, tampered payment amounts, no registration
before verified payment, once-only purchases, ambiguous timeouts and concurrent
orders. Browser fixtures cover the full catalogue, registration and locked checkout.
No live domain purchase was made as a test.
