# Project care pilot

The first monitored project is Opus Zimbabwe. This is operational monitoring, not autonomous repairs. Existing payment, receipt, content and Cloudflare Access protections are unchanged.

## Public plans

The homepage, `/care/` and the web design service page read `/api/care-plans` without a cached fallback. Admin → Project Care & Reports → Website care plans edits names, descriptions, features and visibility.

| Monthly USD | Initial scope per project |
| --- | --- |
| 10 | Monitoring, incident/maintenance records, reviewed monthly report |
| 20 | Monitoring plus 30 minutes of small content updates |
| 60 | Monitoring plus 2 hours total of maintenance/content work |
| 120 | Monitoring plus 5 hours total and priority support |

Time does not roll over. Monday–Friday 08:00–17:00 Harare time, excluding public holidays. Priority is queue priority, with no guaranteed repair time. New development, major repairs, hosting/domains and paid suppliers are separate. Updating code or dependencies is human work, not a claim of automatic repairs.

## Checks and records

`opus-care-scheduler` calls a dedicated authenticated Pages endpoint every five minutes. `wrangler.care.toml` defines the Worker; Pages itself has no Cron triggers. Both deployments require the same encrypted `MAINTENANCE_CRON_SECRET`. The scheduler has no public HTTP endpoint, D1 binding, payment keys or customer data. Deploying it requires Account → Workers Scripts → Edit.

Only four fixed GET targets can be checked: public home, checkout, content API and payment configuration. Redirects fail checks. HTTPS fetch validates the certificate; expiry dates are not collected. Checks never initiate payments, register domains or edit sites. A D1 slot reservation prevents concurrent/manual requests from running duplicate probes.

Three adjacent failed slots open an incident; two adjacent successful slots close it. Missing slots interrupt the sequence. One admin alert attempt per incident uses Resend with idempotency. At most five alert attempts per UTC day; further open incidents stay pending and remain visible in admin. Provider acceptance is not delivery. Uncertain sends are never automatically replayed. Failed alerts are visible for manual investigation. Sending-domain configuration must be complete for mail.

Admin defaults: alert recipient `support@opuszim.co.zw`; report recipient empty until explicitly entered. Admin can pause checks, change recipients/plan, run a check and append timestamped maintenance/deployment/backup/note records. Records are append-only. Current views show the newest 60 events and 40 incidents; monthly drafts keep up to eight recent maintenance notes, with their detailed notes in the PDF. This pilot does not yet import deployment events, provider logs or verify backups automatically.

Raw checks/run slots are retained 90 days. Events, incidents and approved report snapshots are retained. No request/response bodies, payment credentials, PINs or visitor data are logged by these checks.

Monitoring shares Cloudflare infrastructure with the monitored site. A total Pages/Cloudflare outage can prevent checks/alerts from executing; gaps appear in coverage. The scheduler is not an independent third-party uptime SLA. Workers/Pages/D1/R2 and Resend quotas are shared with other site features; check usage in their dashboards. At five-minute frequency the pilot makes about 1,152 target checks/day. It is designed for free-tier allowances, not a guarantee of unlimited or permanently free service. No paid rendering or AI service is used.

## Reviewed PDF workflow

At the start of a new Harare month, the scheduler creates a previous-month draft if the project was monitored that month. Admin can prepare/refresh a current-month draft. Closed/approved snapshots cannot be silently overwritten. The report uses recorded sample pass rate and expected time slots separately; no data produces “No data”, never 100%. The expected period includes pre-monitoring gaps. Backup status stays unverified even when a human adds a backup note.

1. Set the authorised report recipient in monitoring settings.
2. Prepare/open a draft and preview/download its branded Poppins PDF with an overview and detailed evidence.
3. Approve the PDF. The browser generates the PDF, avoiding a paid renderer and Workers PDF CPU cost. The authenticated approval stores its hash, actor and private R2 object. The submitted PDF must be under 250 KB.
4. Choose Send explicitly. The server verifies the stored PDF hash and attaches that exact approved file. Recipient and delivery status are recorded. Atomic reservation and provider idempotency prevent duplicate sends.
5. Check delivery to distinguish accepted/delivered/bounced/failed. A definite provider rejection without an accepted email reference can be explicitly prepared for retry after correction; ambiguous sends require checking Resend and are never blindly retried.

Private `care_private_*.pdf` keys cannot pass the public `/api/media/:key` image allowlist. Downloading saved PDFs requires the existing admin JWT. Report APIs are no-store. Real alert/report sends are not part of isolated tests.

## Deploy / verify

Apply `0022_maintenance_pilot.sql` after a private D1 backup, then build/deploy Pages. Set the same randomly generated 256-bit cron secret on Pages and the scheduler (never commit it). Deploy Worker with `wrangler deploy --config wrangler.care.toml`; set its secret with `wrangler secret put MAINTENANCE_CRON_SECRET --config wrangler.care.toml`. No new Resend key is needed: Pages reuses the receipt sender.

Check the admin's last completed run, four current results and actual Worker Cron trigger. A configured secret alone does not mean the scheduler is running. Manual checks share the same five-minute lock. No real payment is required for verification.

`scripts/test-care.cjs` covers authentication, fixed targets, duplicate prevention, incident/recovery thresholds, gaps, Harare periods, report approval/privacy, recipient checks and email deduplication with fake providers. `scripts/test-care-ui.cjs` verifies the actual Poppins PDF and desktop/mobile views with mocked writes/emails.
