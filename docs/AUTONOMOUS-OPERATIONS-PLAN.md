# Opus operations platform: 10–100 customers

Status: implementation plan following a live hosting and code audit on 27 October 2026. This document does not enable new charges, provider subscriptions or autonomous customer messages.

## Current evidence

- Opus runs on Cloudflare Pages with Workers/Pages Functions, D1 and private R2 storage.
- The five-minute scheduler is deployed. The latest inspected website, checkout, content API and payment configuration checks passed.
- Domain checkout collects legal registrant details separately from receipt contacts. Retail pricing defaults to supplier cost plus 25%, minimum USD 5 gross markup.
- Pesepay results are independently queried and checked for reference, successful state, amount and currency. A browser return or callback body alone is not proof of payment.
- The registrar flow rechecks availability, price and eligibility, then conditionally claims a single registration submission. Unknown supplier outcomes are checked without blindly resubmitting a purchase.
- Receipts and care PDFs have private delivery controls, recorded provider acceptance/delivery, and duplicate-send protection. Approved report editions and original email records are preserved.
- The care pilot currently monitors Opus only. Repository/Vercel event ingestion, per-customer maintenance billing, unattended PDF rendering and a general durable work queue are not yet implemented.
- Current care PDFs are generated in an admin browser. That workflow cannot by itself produce autonomous payment-triggered PDFs in the cloud.

## Money and ownership

1. Customer enters the domain and the registry-required legal/contact/eligibility information.
2. Server obtains a current supplier quote, applies the Opus margin, and fixes an expiring customer quote.
3. Customer pays Opus through Pesepay. Independently verify the exact order reference, USD amount, currency and final successful state.
4. Persist a fulfillment job before acknowledging completion of internal processing.
5. Recheck supplier price, availability and eligibility, then submit the approved registration once.
6. Cloudflare uses the billing method on the Opus Cloudflare account. Pesepay does not pay Cloudflare directly, and this application must not collect or store your card details.
7. Record the registrar result and send a truthful receipt/status notice. A domain is only described as registered after supplier confirmation.

The customer remains the legal registrant. Cloudflare remains the registrar of record. Opus manages the service. Zimbabwean/local extensions remain assisted where the supplier route does not support them.

Pesepay settlement and Cloudflare card charging have different timing. Maintain sufficient available card funds/credit independently of unsettled Pesepay receipts. Bank declines, additional verification, registry restrictions, unavailable names and supplier outages need explicit resolution paths. A payment reversal after registration requires accounting/support handling, not an automatic attempt to undo an irreversible registration.

## Reliability foundation: implement first

- Persist incoming event identifiers and a durable D1 outbox. Separate verification, order fulfillment, document generation and email into recorded steps.
- Bind each job to an immutable customer/order/payment/billing-period identifier. A free-text invoice alone cannot identify an entitlement.
- Use atomic job claims, lease expiries, bounded batches and unique operation keys. Handle at-least-once delivery without repeating business actions.
- Retry safe reads and demonstrably unsubmitted operations with increasing delays and a maximum attempt count.
- For registrar purchases, payment initiation and uncertain email acceptance, first query the provider. Never treat a network timeout as proof that nothing happened.
- Scheduled reconciliation must find missed callbacks, pending payments with known references, paid/unfulfilled orders, stuck jobs and missing document deliveries. It must not depend on a customer browser or an admin opening the ledger.
- Put exhausted or ambiguous jobs in a visible resolution queue. Preserve the payment, supplier response category, attempts, last error and next action; alert the admin.
- Validate event signatures/timestamps, reject replay and oversized payloads, and restrict log ingestion to the configured project. Avoid secrets and customer message bodies in operational logs.
- Keep the current admin Access authentication. Store provider secrets only in encrypted environment bindings, scoped to the functions/jobs that need them.
- Test duplicate/out-of-order events, simultaneous workers, provider acceptance followed by timeout, payment reversal, quote changes, card failure, quota exhaustion, and worker restart.
- Verify backups through a separate recovery test before claiming backup protection.

## Multi-project monitoring and logs

Register Great Couples first with its repository, deployed URL, authorised billing recipient and USD 10 plan. Extend this same project register for later customers; do not copy hard-coded Opus-only flows for every customer.

Collect signed GitHub push/workflow/deployment events and Vercel deployment events through a configured integration. Those events do not require repeatedly polling every repository. Record commit, deployment, environment, result and timestamp without retaining source contents or secrets.

For free runtime logging, add a small authenticated structured logger to the application/server functions where source access exists. Store selected errors and relevant operational events in Opus. Label these as application logs: they do not equal Vercel's complete native runtime/platform log stream. Client-side logging alone also cannot replace server logs. Vercel's native non-audit Drains currently require a paid plan and usage billing.

Separate customer/project records and quotas. Keep detailed event/error data briefly, retain compact monthly summaries, and budget writes before accepting a log burst. Payment processing and fulfillment take priority over optional telemetry. Do not silently drop payment jobs to stay inside a logging quota.

The current five-minute pilot cannot be expanded to 100 customers simply by multiplying its raw log writes. At 100 sites, one five-minute observation per site is 28,800 observations/day before deployment logs, database indexes and retention work. Use batched/sharded checks, compact rollups, change-based incident records and enforceable ingestion budgets. Preserve advertised check intervals or explicitly revise the service terms before changing them.

## Maintenance payment and document rules

Create a server-priced maintenance order with project, billing period, recipient and amount; prevent two active paid entitlements for the same project/period. Great Couples starts at USD 10. A verified online payment activates the entitlement; no manual paid flag or arbitrary checkout reference may trigger documents.

The user still needs to confirm the maintenance billing period and authorised Great Couples delivery email. Also settle whether a mid-month payer receives a progress report immediately or the complete report after month-end. Never report future work as completed. Any exception to the existing admin report review rule must be explicit per project.

Use server-side/background document generation with the existing Poppins/Opus template, recorded snapshot and edition controls. Select a rendering route after testing its actual CPU/usage limits; free Workers cannot be assumed to run arbitrary PDF/browser/long-running workloads. A queued render that hits a limit is pending, not successfully delivered.

Where the agreed reporting period is complete, one email with both the receipt and care-report attachments reduces volume. Keep exact approved/generated files privately, record provider acceptance, and distinguish delivery/bounce/failure. Do not replay uncertain sends. Rate-limit all operational and customer messages against the shared mail allowance.

## Free-tier boundaries and scaling gates

Start on Cloudflare's free services within their quotas; do not enable paid services automatically. Free does not mean unrestricted runtime, unlimited logs or guaranteed capacity for every workload.

Official documentation checked during the audit:

- Workers Free: 100,000 requests/day and 10 ms CPU per invocation. D1's listed free allowance includes 5 million rows read/day, 100,000 rows written/day and 5 GB storage. Limits are shared with the production website and other services. https://developers.cloudflare.com/workers/platform/pricing/
- Vercel Hobby is limited to non-commercial personal use. Verify the eligibility of each hosted customer project or choose appropriate hosting. https://vercel.com/docs/plans/hobby
- Vercel non-audit Drains require Pro/Enterprise and have usage pricing; native log export is not a universally free component. https://vercel.com/docs/drains

Email, PDF rendering, AI and WhatsApp have their own quotas/charges. Reserve budget for spikes; 100 customers paying on the same day can exceed a free mail daily allowance once receipts, reports and support replies are combined. Queue within an agreed delivery window or select a paid allowance before promising immediate delivery at that peak.

Scale through 10, 25, then 100 customers using measured jobs/day, queue age, retry counts, provider errors, rows written, storage and email volumes. Alert before quotas are exhausted. A small paid operating budget may be necessary for dependable service at the upper end; do not promise permanent free operation for arbitrary automation.

## Rollout order

1. Durable payment/order jobs and scheduled reconciliation; prove safe recovery with fake providers and bounded live read checks.
2. Great Couples project register, signed repository/deployment events, selected application logs and scoped admin views.
3. Confirm billing/report rules, then automate verified-payment entitlements and unattended branded documents.
4. Add email support automation using approved business content and handoff for uncertainty, complaints and actions outside the configured financial rules.
5. Add official WhatsApp Business Platform integration. Account for conversation/template rules and paid message categories; avoid unofficial personal-account bots.
6. Consider calls after the written-channel workflow is proven. Telephony, recording, transcription and voice processing require their own provider, consent workflow and budget.

Success means payments and customer work remain traceable and recoverable when a provider fails. It does not mean pretending that banks, registries, hosting providers or messaging platforms can never fail.
