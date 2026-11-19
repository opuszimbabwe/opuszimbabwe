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

The requested controlled live WhatsApp test is pending one fresh inbound
message from the owner's test phone. No live WhatsApp send was performed by
the agent. Sender credential validity and Meta acceptance/delivery therefore
remain unverified. Existing admin Access authentication was not bypassed.
