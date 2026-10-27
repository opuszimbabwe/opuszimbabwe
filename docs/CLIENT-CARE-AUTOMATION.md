# Great Couples: payment-linked care automation

This pilot uses `https://www.greatcouples.org.zw/` as its public monitoring target. No access to its private repository or Vercel account is required for the implemented public checks. Those private systems are **not** represented as monitored integrations.

## Customer and billing setup

Admin → Customer Care & Automation contains the Great Couples project, authorised document recipient, billing orders, document queue and maintenance history. The authorised recipient is configured privately in D1; no customer email is seeded in a public migration. The service price is fixed server-side at **USD 10/month** for this pilot.

Choose an **unpaid** billing month and create a private payment link. Do not create another charge for a month already paid through an older, unrelated invoice. Earlier free-text payments are not automatically guessed or matched to customer entitlements.

The link contains a random 256-bit capability; D1 stores its hash only. Copy the link when it is created. A lost, unpaid link can be replaced, revoking the old link for payment. A pending/paid/uncertain payment cannot be replaced with another charge. The browser removes access tokens from its address bar where storage is available. Checkout fixes USD, amount and order reference. The server also rejects tampering, freezes the order's authorised recipient and prevents concurrent charges for one project/month.

Customer details cannot redirect documents to an arbitrary email. Changing the project's recipient affects new orders; already-issued orders retain their original recipient. Disabling billing/document automation stops new maintenance payment initiations for the project.

## After a verified payment

Pesepay's reference, final success, exact amount and currency are independently queried. Notifications and checkout return pages alone are not payment evidence. Only a verified paid care order can queue documents.

- A current-month payment queues a combined **verified receipt + progress report** PDF/email.
- A final report packet becomes eligible one minute after that month closes in Africa/Harare.
- Payment for a completed month queues its final packet immediately, including the receipt.
- A job is uniquely identified by order and document kind. Repeated callbacks/polls cannot create duplicate emails or another payment.
- No unpaid/manual paid flag exists. Revoked/reversed payments block future documents and private downloads; already-delivered email cannot be recalled.

## Cloud execution and recovery

The scheduler wakes every minute. The existing Opus and Great Couples monitors retain five-minute slot locks, so checks are not performed every minute. Each wake also checks at most two known-reference pending payment/order records and processes at most one due document job. This keeps the initial workload bounded.

Recovery never initiates another payment. It independently rechecks pending care/domain payments and resumes the existing registrar state machine for verified domain orders. Registrar submission still uses the single irreversible claim and checks ambiguous outcomes rather than blindly repurchasing. No payment is forwarded directly from Pesepay to Cloudflare; the existing Cloudflare account billing method funds registrar purchases.

Document jobs persist their snapshot before rendering, claim a three-minute lease, store the generated file privately in R2, verify its SHA-256 digest, then reserve a single email attempt. A dead worker's safe rendering step may resume; a stale in-flight email becomes uncertain and cannot be blindly resent. Exact email attempts have stable provider idempotency keys and searchable job tags.

The `opus-care-renderer` Worker uses Cloudflare Browser Run to create the receipt/report packet in the cloud, with embedded Poppins, the Opus logo, status panels and tables. It is reached through a private Pages service binding, has no public workers.dev/preview route, and requires its encrypted render secret. Brand assets are fetched only from fixed Opus URLs and inlined before rendering. Other browser resource requests are blocked. PDFs over 250 KB fail visibly rather than being sent as broken attachments.

Cloud rendering is quota-bound: Workers Free currently includes 10 browser minutes/day, three concurrent browsers and one new browser instance per 20 seconds. The one-job-per-minute pilot avoids intentional bursts. A busy renderer or exhausted allowance leaves paid work queued. Repeated render failures require admin review. No paid upgrade is activated by this implementation.

Operational alerts retain their shared five-attempt daily cap. Document sending has a separate 90-attempt UTC daily budget to leave room for other mail, but the provider's account allowance is still shared with receipts and support messages. A provider rate-limit response queues a safe retry. Uncertain responses do not. Provider acceptance is distinct from delivery; admin can refresh delivered/bounced/failed status.

## Reports, privacy and actual coverage

Public HTTP/HTTPS results, response times, observed coverage and incidents are measured. Three adjacent failures open an incident; two adjacent successes close it. Missing slots interrupt a failure streak. Raw checks retain the existing 90-day policy.

Public checks do not prove checkout/form/browser interactions, certificate expiry, backups, repository changes or Vercel runtime behaviour. The PDFs state these limits and show monitoring gaps, including the period before monitoring began. No maintenance work is invented. Internal operator notes are excluded; only records explicitly marked “Include this note in customer reports” are included.

Admin and customer PDF downloads require authentication/capability and a fresh successful payment verification. R2 document keys do not match the public image-serving allowlist. Public care-order responses do not disclose recipient emails, internal notes, snapshots or provider delivery IDs. API/document responses are no-store.

## Operator actions

- Create/copy the correct private link; creation alone sends no message and requests no charge.
- Inspect the queue for delayed, configuration-blocked, rejected or uncertain work.
- “Process due work” performs safe reconciliation and one eligible job; it can deliver already-authorised paid work.
- Retry controls are limited to unaccepted, definitely safe attempts. Provider-accepted or uncertain emails cannot be restarted by that control.
- Check delivery status, download the verified packet, and record real maintenance work with deliberate customer visibility.

## Configuration and release

Apply migration `0024_client_care_automation.sql` after a private D1 backup. Set the customer recipient privately and enable the project policy. Deploy `wrangler.renderer.toml` first. Pages needs the `CARE_RENDERER` service binding plus encrypted `CARE_RENDER_SECRET`, matching the renderer's secret. Existing Resend/Pesepay keys remain encrypted and unchanged. The scheduler retains its separate `MAINTENANCE_CRON_SECRET` and uses the one-minute trigger from `wrangler.care.toml`.

`scripts/test-client-care.cjs` uses isolated SQLite/R2, an encrypted fake gateway and mocked mail/render providers. It covers fixed billing, capabilities, recipient protection, recovery without a browser, duplicate prevention, month-end timing, filtering, retry/uncertainty, and reversal protection. Existing payment/domain/receipt suites remain required. `scripts/test-client-care-ui.cjs` runs actual React components against intercepted browser fixtures; it starts no local server and sends no real messages or payments.

A real cloud PDF sample was generated without a payment or email to validate Browser Run, the logo and embedded Poppins. No live customer charge or test email is required for release verification. A full production payment/email journey remains to be observed when the client actually pays an issued care order.

This is a first-customer pilot, not a claim that 100 simultaneous payers fit every free allowance or receive documents instantly. The queue and scoped records provide the foundation; measure quotas and queue age before expanding project hosts, throughput, private log integrations or customer communication channels.
