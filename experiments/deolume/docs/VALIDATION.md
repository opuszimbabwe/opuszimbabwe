# Preview validation

16 November 2026. Separate browser/site tests only; no payment, customer message,
production database or production Worker mutation.

- Seven pages at 320, 390, 768 and 1440px: HTTP 200, one clear h1, all images
  decode, no horizontal document overflow, native menu and Escape behavior.
- Cookie choice persists; preferences can reopen and save. No external runtime
  requests were observed while browsing the seven pages.
- Desktop services respond to actual scrolling with changing computed transforms.
  The marquee actually moves; pause freezes its computed transform. The pause
  choice survives navigation in the same tab. OS reduced-motion changes stop
  motion, and an initially reduced-motion page exposes the vertical fallback.
- Project/concept dialogs open, label concept provenance, close on Escape and
  restore the invoking control's focus. A partially visible service card was
  clicked with actual pointer coordinates and reached the correct digital page.
- Property dots/arrows change the active slide. Poster next controls, filters,
  concept details, FAQ expansion and digital keyboard tabs work.
- Property enquiry context prefills the intended service. Required fields and
  consent are validated before a WhatsApp/email draft is prepared. WhatsApp
  was intercepted in the browser context, with no message sent.
- The no-JavaScript form fallback targets the email app with a POST form,
  preventing enquiry details from becoming a website GET query.
- No browser exceptions were recorded. Text and navigation remain available
  in a no-JavaScript mobile context. Architecture photography is real sourced
  photography; original typographic concepts are explicitly identified.

The final CSS change preserves the natural aspect ratio in full-size project
image dialogs. Deployment/live checks are recorded separately after the guarded
preview upload. These checks emulate browser viewports, not physical devices.
PayPal's reference remains unverified because both actual browser attempts
returned HTTP 403. The supplied future film is not yet integrated.

## Served preview

The guarded deployment of source `a20cff5` is available at
https://opus-zimbabwe-redesign.pages.dev/. All seven routes passed served-page
checks at 390px and 1440px, including CSP/noindex headers, local image decoding,
no overflow, live gallery filters/dialogs, carousel dots and navigation. No browser
exceptions, CSP errors, failed requests or third-party runtime requests occurred.
The live Opus deployment, its domains and four supporting Worker versions were
unchanged. The snapshot is in PREVIEW-DEPLOYMENT.json. A 23-second actual browser
walkthrough was captured locally and its video stream and representative frames
were inspected. It is a screen recording, not the future brand film.
