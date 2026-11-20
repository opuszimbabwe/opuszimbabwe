# AI failure isolation — 20 November 2026

The deployed synthetic website-service prompt used the public AI handler, which
has no WhatsApp delivery path. No customer conversation or credential was supplied.

Initial probe: HTTP 503. Private metadata recorded Gemini `gemini-2.5-flash`
HTTP 404, and both configured Groq credentials returned HTTP 404
`model_not_found` for `llama-3.3-70b-versatile`. This establishes a model
availability failure, not the cause of earlier Meta restrictions.

After the model-catalog fallback: HTTP 200 using Groq `openai/gpt-oss-20b`,
selected from the authenticated catalogue and a bounded supported shortlist.
Successful request ID: `req_01m7v3hzc2e5ztdd7gf5nv3z20`.
Gemini's configured default remains unavailable; successful service uses Groq fallback.
No authentication or rate-limit bypass: catalogue recovery runs only on
404 `model_not_found`, not 401, 403 or 429.

Inbox configuration now returns `sender_configured` alongside `configured`.
Previews and AI supersession use original event time, with arrival sequence as
a tie-breaker. Local replay keeps the fresh message current when an older
message arrives during generation; that older message generates no reply.
STOP persistence, human-assistance pause and outside-window suppression pass
mocked regression tests. No historical messages were resent or deleted.

Private provider diagnostics record model, outcome, HTTP status, bounded error
code, request ID and channel. They exclude prompt text, credentials and raw
provider response bodies. Public AI responses do not expose these diagnostics.

The owner performed the controlled live WhatsApp test on 20 November at
02:05 Zimbabwe time. A targeted read-only D1 check confirmed one inbound
message at 02:05:14 and one automated reply at 02:05:22 marked DELIVERED.
The agent sent no live WhatsApp message. This confirms that production
accepted and delivered this reply; it does not establish the cause of the
earlier 131031 restriction or guarantee future account status.

The follow-up formatting release requests concise WhatsApp text and applies
a channel-specific formatter to automated replies: tables become lists and
site navigation becomes full HTTPS links. Website response formatting stays
unchanged. Formatting, unsafe-link handling and length limits pass local
mocked tests; no additional live messages were sent.
