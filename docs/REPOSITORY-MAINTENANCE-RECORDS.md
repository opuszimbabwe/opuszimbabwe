# Great Couples repository and deployment evidence

Great Couples uses `Opus-Zimbabwe/great-couples-international-trust-23941f01` (stable repository ID 1312317100). The other similarly named repository is a separate project and is not used for this integration.

Its `Opus maintenance record` GitHub workflow records main-branch pushes and terminal Vercel commit statuses at `POST /api/maintenance/project-events`. It sends only the repository identity, commit, event type, status, context, time and provider link. Source files, customer data, payment credentials and runtime log contents are not sent.

Authentication uses GitHub Actions OIDC, not a permanent shared secret. The receiver verifies the RS256 signature against GitHub's fixed HTTPS JWKS endpoint, issuer, exact audience, expiry, repository ID/name, main branch, workflow path and event type. Payload identity must agree with the token. Push commits must match the token. A changed workflow path or repository rename needs an explicit receiver update. Invalid input, paused projects and unauthorised repositories fail closed. Duplicate events are ignored; retained evidence expires after about 90 days. The sender retries an unconfirmed event up to three times.

Admin → Customer Care & Automation shows the latest authenticated events. New maintenance PDFs include up to eight recorded repository/deployment results from their observed billing period. Previously generated/frozen PDFs and already-sent documents are not rewritten. A failed deployment is shown as failed, not converted to a successful result. This does not initiate payments, mark unpaid invoices paid, send an extra customer email or modify the existing progress/final billing flow.

The workflow requires GitHub Actions to be enabled and permission for `contents: read` and `id-token: write`. It uses an immutable checkout action and the runner's standard Python library. The organisation's Actions minute allowance applies; this is not unlimited free processing. Main-branch status recording depends on Vercel's GitHub integration posting commit statuses after the repository transfer. If it does not, reconnect the repository in the existing Vercel project.

Private Vercel build/runtime logs are NOT connected by this integration. This session has no Vercel connector tools or Vercel token. GitHub's Vercel status and deployment link are genuine hosting evidence, but do not establish runtime-log access. An authorised Vercel API integration is still needed for private logs; retain redacted operational summaries rather than customer data or unbounded raw logs.

Verification: `scripts/test-project-events.cjs` covers cryptographic authentication, stale tokens, wrong audience/repository/workflow, branch validation, replay deduplication, success/failure evidence, paused projects, links and input bounds. `scripts/test-client-care.cjs` covers unchanged verified-payment delivery. All providers are mocked in these tests.
