# Reconstructed Pages Functions

All 16 previously missing handler paths now contain implemented replacements.
These are new implementations inferred from the deployed route manifest, the
live D1 schema, recovered client/Worker source, and a minimal live cookie probe.
They are **not recovered original source**. No production code or schema has
been deployed by this reconstruction.

## Implemented behavior

| Area | Handlers and behavior |
| --- | --- |
| Website chat | Session creation/resumption, secure hashed cookie capability, private history, bounded message submission, Unicode/rich-text preservation, concurrent idempotency and conversation-scoped replies. |
| Team inbox | Access-authenticated conversation listing, unread counts, replies and clamped read cursors. The existing root Worker continues providing current mutation/hiding, codes and native notification behavior. |
| Attachments | Bounded uploads, content-signature checks, private R2 keys, conversation ownership and sandboxed downloads. |
| Feedback | Validated ratings/comments, retry-safe submissions, honeypot and rate limits, private admin listing/review. |
| Local domains | Consent and extension checks, valid contact details, required PDF letters for assisted .org.zw/.ac.zw applications, duplicate prevention and private staff review/download. |
| Project downloads | Staff-uploaded ZIPs, content hashes and expiring project/hash-bound download capabilities; project IDs alone do not grant private source access. |
| Legacy push | Authenticated device registration/removal, public-key validation, allowed delivery providers and encrypted Web Push after new visitor messages. Existing native notifications remain the deployed Worker's responsibility. |
| AI | Professional public-context answers; private project-ID/status boundaries and human handoff; validated image inputs; bounded Gemini/Groq requests and fallback. No model receives private project records or secrets. |
| WhatsApp | Signed webhook verification, bounded idempotent ingestion, business-phone binding, inbox/read/status actions, 24-hour reply-window checks, text/buttons/lists/CTA links, delayed dispatch and cancellation, private images/media. Ambiguous sends are not automatically replayed. |
| Paynow | Signed form notifications, stored-provider-only polling, independent signed amount/currency/reference checks, verified receipts and reversal protection. Callback status or URLs alone cannot approve payment. |

Admin requests reuse the existing cryptographically verified Cloudflare Access
boundary. Header-only fixtures are restricted to localhost. Mutation routes
require the exact website origin; public message capabilities are never accepted
as staff identity. Provider errors and credentials are not returned to clients.

## Live contract probe

One empty, labelled test session established that the live cookie is
`__Host-opus_chat`, containing 64 hexadecimal characters with HttpOnly, Secure
and SameSite=Lax. The POST response exposes only the documented public session
fields. That exact temporary session was removed immediately, conditional on its
test label and having zero messages. No chat, email, WhatsApp, push or payment
was sent. Sanitized facts are in `ops/reconstruction/live-chat-contract.json`.

## Validation

```sh
npm ci --ignore-scripts
npm run typecheck
npm run test:reconstructed
```

The test suite uses isolated SQLite/R2 fixtures and intercepted provider calls.
It covers all recorded route exports, forged staff headers, capability expiry,
cross-conversation access/replies/files, bounded input and uploads, concurrent
message deduplication, feedback/domain retries, private ZIP grants, encrypted
push, AI privacy/handoff, Meta signature and reply-window enforcement, webhook
delivery races, uncertain-send non-replay, media SSRF restrictions and independent
Paynow verification. The generated complete Pages router is also exercised in
workerd with actual local D1/R2; external network access is disabled there.

Existing payment/domain/admin-receipt/client-care/repository-event/maintenance
regressions passed with all providers mocked. No real financial transaction,
domain purchase, customer message or production migration was performed.

## Explicit differences and release gates

- Apply migration `0027_reconstructed_pages_features.sql` only as part of a
  reviewed release. It preserves existing tables and adds download-capability
  grants plus durable WhatsApp delivery events and supporting indexes.
- Private project downloads now require an administrator or expiring capability.
  Any existing download-link workflow needs review; public project IDs are not
  treated as credentials.
- WhatsApp AI auto-replies preserve the original configured-model behavior.
  `WHATSAPP_AI_ENABLED=false` explicitly disables them; `true` enables them.
  Without an override they run when Gemini/Groq credentials are configured.
  Verified inbound messages also reach the human inbox. Models are configurable
  with optional `GEMINI_MODEL`, `GROQ_MODEL` and `GROQ_VISION_MODEL` variables.
- Scheduled WhatsApp dispatch is integrated with the authenticated maintenance
  tick. Replies with uncertain provider acceptance require reconciliation.
- Paynow's original initiation/status implementation was not recovered; its
  interaction with the older supporting payment library must be reconciled
  before enabling a complete Paynow checkout. The new callback itself is tested.
- Full staging parity with the deployed frontend, existing private sessions,
  original supporting modules, private downloads and real merchant/provider
  configuration remains a release requirement. Local mocked tests do not prove
  provider acceptance, settlement or physical-device notification delivery.

`reconstruction_release_ready` remains false. Automatic production deployment
and the build guard remain in place. The pending Mastercard feature is separate;
the manual preserved-asset release path is documented in
`../ops/activation/README.md`. It does not permit rebuilding the older frontend.
