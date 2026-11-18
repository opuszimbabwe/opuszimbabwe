# Canonical www redirect and shared cookie choice

User-authorised scope: investigate/fix www.opuszim.co.zw, provide one shared
cookie-consent choice for the main site and Opus Pay, and investigate Omari Visa
compatibility with Cloudflare domain purchases without making a payment.

## www

Observed before repair on 18 November 2026:

- HTTP and HTTPS www returned Cloudflare 522; apex HTTPS returned 200.
- TLS reached Cloudflare; this was not a browser certificate warning.
- Pages had active apex and payments domains, but no www custom domain.
- The zone had only the apex Worker route. No www Worker route was present.
- The available token could read the zone and Worker routes; DNS-record reads
  returned Cloudflare permission error 10000, so the origin record was not verified.

The dedicated redirect Worker responds at the edge, without fetching the failing
origin. Its only route is www.opuszim.co.zw/*. It sends a 308 to HTTPS apex and
preserves paths, query strings and HTTP methods. It never edits DNS and preserves
all existing routes and four original supporting Worker versions.

Run deploy-www-redirect.py for read-only preflight; --activate uploads the small
reviewed module and attaches only its www route. www-before.json preserves the
original routes, and www-release.json records the resulting route/deployment.
If route attachment fails, the script removes its unused newly created Worker.
Rollback removes only the recorded new route and dedicated Worker; it restores the
original state, which had a broken www origin. Do not remove the apex route.

## Shared cookie choice

The public HTML changes are limited to one versioned, self-hosted consent script
include. Existing page bodies and JS bundles, protected admin HTML and the Pages
backend remain unchanged. A small cookie notice is added at /cookie-policy/.
The current-root Worker continues its existing HTML/content transformations.

The preference is __Secure-opus_cookie_choice=v1.essential, Domain=opuszim.co.zw,
Path=/, Secure, SameSite=Lax, 180 days. It is a non-authenticating preference,
not a payment token or customer identifier. No private checkout/session data is
shared through it. The user confirmed shared consent only, not payment-session
continuity. Existing capability checks and sessionStorage recovery are unchanged.

Only essential cookies are currently offered. There are no pretend optional
tracking toggles or an Accept all button for nonexistent advertising cookies.
The actual live site includes Cloudflare's cookieless Web Analytics beacon; this
is disclosed explicitly rather than described as disabled or covered by an
analytics-cookie switch. The essential-only choice is not an opt-out of that
beacon or infrastructure request/security logs. A future optional tracker must
have appropriate controls before it is enabled.

The published privacy policy was reviewed from live HTML, not the stale draft
app/privacy/page.tsx. Its cookie/storage section already distinguishes required
storage from optional tracking and explains private checkout capabilities.
The new factual notice complements that published policy; this work does not
claim a legal review or certify statutory compliance.

Build initially with npm run build:checkout -- --shared-cookie-choice. Future
checkout builds preserve consent automatically once recorded in the current
release. Only full public documents receive the include; protected admin pages
and embedded template-preview fragments are excluded. Browser tests use mocked
HTTPS origins to exercise actual parent-domain cookie behaviour without live
payment calls. A normal checkout test on localhost does not display the
production-domain-only preference widget.

## Omari Visa findings

The user identified the card as virtual/prepaid and USD-funded. Cloudflare's
published billing policy lists Visa as supported, but explicitly warns that gift
and prepaid cards may not be accepted because they may lack a billing address.
Its failed-payment guidance requires correct billing details, sufficient balance
and successful 3D Secure where requested, and says the issuer must explain declines.

Conclusion: the Visa network is supported; this does not verify acceptance of
this particular Omari prepaid card for Cloudflare Registrar. International online
purchase support, a registered billing address, issuer/merchant restrictions,
3DS capability and sufficient funds still determine acceptance. No card number,
CVV, PIN or OTP was requested; no card was added, charged or preauthorised, and no
domain was purchased. Issuer confirmation or an owner-controlled transaction is
needed for a definitive card-specific answer.

Official sources reviewed through Cloudflare's public documentation repository:

- https://developers.cloudflare.com/billing/understand/billing-policy/#approved-payment-methods
- https://developers.cloudflare.com/billing/troubleshoot/troubleshoot-failed-payments/
- https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/billing/understand/billing-policy.mdx
- https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/billing/troubleshoot/troubleshoot-failed-payments.mdx
- https://developers.cloudflare.com/web-analytics/

Direct access to developers.cloudflare.com, Omari's site and public DNS-over-HTTPS
hosts was denied by the environment's hostname allowlist. The official public
GitHub documentation was an available source. No network rules were bypassed.
