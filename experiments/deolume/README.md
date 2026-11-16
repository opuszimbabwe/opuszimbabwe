# Deolume — separate global design preview

Deolume is the global brand direction for Opus Zimbabwe. This standalone site
continues the previously separate redesign. It does not replace the working
Opus website, alter its checkout, access its APIs or use production DB/R2 bindings.
No claim is made that deolume.com has been registered or connected.

Preview: https://opus-zimbabwe-redesign.pages.dev/
Source branch: `design/deolume-global`.

Pages: home, graphic design, digital, property/construction, studio, contact and
privacy. The reference observations and access limitations are recorded in
[docs/REFERENCE-STUDY.md](docs/REFERENCE-STUDY.md).

## Work locally

From this directory, using Node 22+:

```sh
npm run build
npm run dev
# Separate terminal, with the local preview running:
npm test
```

The build uses only Node built-ins. There are no external runtime scripts,
font CDNs, trackers, embedded videos or frontend package downloads. Browser
checks use the environment's Playwright/Chromium, or PLAYWRIGHT_MODULE_PATH.
All generated files are in ignored `dist/`; screenshots are in ignored
`artifacts/`. Source and asset licences are retained alongside the build.

The contact form prepares an email or WhatsApp draft for the existing Opus team.
The visitor reviews and sends it in that app. It does not silently send, claim
server delivery or create a production conversation. Tests intercept handoffs.
Architecture photography is credited in assets/photo-sources.json. Portfolio
screenshots are existing Opus Zimbabwe work; graphic posters are labelled
original concept studies. A supplied brand video is reserved for a later change.

## Preview deployment boundary

ONLY deploy this directory's dist/ to the EXISTING SEPARATE Pages project
`opus-zimbabwe-redesign`, at https://opus-zimbabwe-redesign.pages.dev/.
The project `opuszimbabwe`, all its domains and Workers must remain unchanged.
Do not invoke the root application's production build or deployment commands.
Do not connect deolume.com or change any DNS record for this preview.

After committing the reviewed preview source, `npm run deploy:preview` runs the
separate build/upload with explicit project targeting, verifies zero production
resource bindings and compares the live Opus deployment, domains and all four
Worker versions before/after. It stops if the initial boundary changed.
The prior redesign deployment was afcc47f1-a089-4ddd-9a06-116e3ae6bf7c and can
be restored independently if needed. Keep this work on design/deolume-global;
never merge it into the production frontend automatically.

Validation includes seven pages at 320/390/768/1440px, image decoding, no overflow,
real computed animation/scroll changes, pause/persistence/reduced-motion behavior,
native dialogs/menu focus and Escape, property sliders, poster filters/details,
keyboard tabs, cookie preferences, enquiry context and draft generation. Mocked
handoffs do not send real messages. No card or payment tests belong in this site.
