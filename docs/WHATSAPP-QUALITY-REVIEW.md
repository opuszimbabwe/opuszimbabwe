# WhatsApp quality controls review

Reviewed 17 November 2026 against the Meta help article supplied by the owner.
This is a source-code review, not an inspection of the live account's quality
rating, template history, customer messages or 30-day analytics. No messages were
sent and no live bot or Meta account settings were changed.

## Existing controls

- `functions/_lib/whatsapp.ts` checks the customer-service reply window both
  when scheduling a reply and immediately before dispatch. A delayed reply
  cannot be sent after that window closes.
- Message IDs and stored payloads prevent duplicate queue entries. Sending uses
  an atomic queue claim. Ambiguous provider responses become `UNCONFIRMED` and
  are not automatically replayed.
- The webhook verifies Meta's HMAC and the configured receiving phone-number
  identifier, deduplicates inbound events and preserves delivery/read status.
- The admin reply endpoint requires administrator authentication and applies an
  administrator/request rate limit. This is not a recipient frequency limit.
- The reviewed reply API supports service-window text/interactive/link replies;
  it does not implement an approved-template campaign sender outside the window.

## Gaps to resolve before proactive outreach

1. **Consent record.** There is no WhatsApp-specific ledger recording opt-in
   source, timestamp, purpose and subsequent withdrawal. An inbound support
   message should not be treated as unrestricted consent to marketing.
2. **Opt-out.** No explicit STOP/unsubscribe handler or suppression check was
   found in inbound processing, enqueue or dispatch. AI currently receives text
   messages, including text that could express an opt-out. Opt-out handling
   should precede AI and cancel queued nonessential outreach.
3. **Recipient frequency.** The admin API's general rate limiter and bounded
   queue batches do not prevent several messages being sent to one customer in
   a short interval. Define recipient cooldowns and purpose-based limits.
4. **Human resolution.** AI is called with the latest inbound message alone.
   Review conversation context, reliable handoff and the visibility/ownership
   of unanswered conversations before expanding automation.
5. **Quality monitoring.** There is no application dashboard for Meta phone or
   template quality trends, restriction reasons, recent template changes, or
   opt-out trends. Delivery/read events alone do not establish satisfaction.
6. **Templates.** If business-initiated outreach is added, require an approved
   appropriate template, matching consent and suppression checks, and a
   relevant, expected reason for contacting the person. Do not add a free-form
   workaround to the service-window guard.

## Proposed next work

- Implement the consent/suppression model and opt-out parsing first, with mocked
  tests proving that opted-out customers cannot receive queued outreach.
- Add per-recipient limits and a clear human handoff workflow.
- Add read-only quality/template monitoring after confirming current Meta API
  permissions and account identifiers; display unavailable metrics honestly.
- Review template changes and consent coverage before any outreach experiment.
  Measure replies, resolution and opt-outs rather than increasing volume alone.

The supplied article's reference to 1,000 conversations is an eligibility claim
in that article, not a target to generate unnecessary messages. Confirm current
eligibility criteria in Meta's current documentation or WhatsApp Manager before
relying on that threshold.
