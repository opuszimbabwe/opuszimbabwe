# Opus Zimbabwe — domain provider setup

Requested goal: sell/register and manage customer domains, with local payments collected through Opus and Zimbabwean domain enquiries handled by support/WhatsApp. The default proposed route is registering through Cloudflare Registrar for the extensions Cloudflare supports, rather than claiming independent ICANN accreditation.

## What is already verified

- The existing Cloudflare account/project serves the Opus website and payment checkout.
- Cloudflare's official September 2026 Registrar API documentation supports domain search, real-time availability/pricing checks and programmatic registration, including an inline customer registrant contact.
- The available API token returns **403 Authentication error** for both registrar domain listing and extension lookup. Registrar registration/readiness cannot be completed or checked with that token.
- No domain has been purchased or transferred as part of this setup. No accreditation or reseller approval has been claimed.

## Owner setup in the Cloudflare account

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
