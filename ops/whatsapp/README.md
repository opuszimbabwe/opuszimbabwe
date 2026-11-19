# Private WhatsApp diagnostics

Open `/sysadmin/whatsapp-tracker/` using the existing Cloudflare Access admin
account. The page is noindex, no-store, CSP-protected and has no send-test action.
It reads `/api/admin/whatsapp?diagnostics=1`; identity verification and explicit
local resume use the same authenticated API with origin checks. There are no
public diagnostics, test bypasses, credentials or real contact numbers in source.

The tracker records the configured Phone Number ID for each outgoing request,
Meta display-number identity snapshots, signed webhook business-number metadata,
WABA association when known, recipients, API version, response/provider IDs,
status timestamps, origin, AI provider/model (including rules-based answers),
triggering inbound references, structured errors/subcodes/details/trace IDs and
available usage/retry headers. Unknown historical sender/model values stay unknown.
App ID is optional (`WHATSAPP_APP_ID`) and is not inferred from the WABA ID.
A signed notice from an unknown WABA is not attributed to the configured sender.

Sender identity verification makes only a Meta GET; it does not register the
number or send a message. The optional Meta Health Status GET records phone/WABA/business/app availability
and provider-reported reasons; BLOCKED health creates a local safety pause.
A successful identity lookup or high/green quality
rating does not clear a local pause or establish that Meta has no restrictions.
Account/quality notices require the corresponding Meta webhook subscriptions;
this release does not change Meta subscriptions or claim unseen reasons.

Freshness and reliability:

- Incoming events older than five minutes remain in the inbox but do not trigger
  automatic replies. This is an application choice, separate from the 24-hour rule.
- Incoming messages and statuses are persisted before webhook acknowledgement;
  AI generation runs in Cloudflare waitUntil instead of holding Meta’s ACK open.
- A response generated while a newer inbound arrives is suppressed and logged.
- Durable send-start audit is required before a provider request; failure blocks it.
- Explicit provider rejection is FAILED with captured error data. Ambiguous
  acceptance remains UNCONFIRMED and is never replayed automatically.
- Error 190, 131031 or 131048 creates a local pause and cancels queued unsent
  replies. Authenticated resume requires explicit acknowledgement after Meta
  review; it does not requeue cancelled/failed/uncertain work.
- Existing 24-hour reply limits, duplicate handling and delivery monotonicity remain.

Audit records are private and retained for 90 days by routine maintenance. Message
bodies stay in the existing private inbox rather than being duplicated in event
logs; recipients and identifiers are operational personal data. Secrets, auth
headers and URL query credentials are redacted from diagnostic fields. Exports
are private browser downloads; do not commit them. A durable opt-out preference
list and wider marketing/template workflows are separate follow-up work, not
claimed as implemented by this tracker.

Validation:

```
npm run typecheck
npm run test:reconstructed
node scripts/test-whatsapp-tracker.cjs
```

All providers are mocked. Coverage includes sender/recipient/model/trigger
attribution, identity GET without sends, authenticated access and origin checks,
redaction, unassociated WABA notices, delayed/duplicate/superseded messages,
asynchronous failures, restrictions/resume, no ambiguous replay, failed tracking,
pagination with tied timestamps, private mobile UI and XSS-safe text rendering.

`ops/site/deploy-whatsapp-tracker.py` defaults to preflight. `--activate` applies
only additive migration 0029 and deploys the tested backend with every current
frontend hash and supporting Worker version preserved. It does not change Meta
account settings or send messages. Never apply the old migration backlog.

Meta Health Status reference: https://developers.facebook.com/documentation/business-messaging/whatsapp/support/health-status
