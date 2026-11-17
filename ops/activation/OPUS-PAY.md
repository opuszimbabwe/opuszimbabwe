# Opus Pay checkout

The approved method-first design uses Poppins, a warm grey background, shallow
notched white group cards and small original provider artwork. The CSS and SVG
geometry use the 1536 × 1024 concept as the desktop reference; mobile layouts
retain accessible targets and fit the selector and payment details to the viewport. Original provider artwork
can differ from the image generator's redrawn wordmarks. Do not replace genuine
brand artwork with generated imitations to match a mockup.

- Cards: Visa, Mastercard and ZimSwitch, hosted by Pesepay.
- Other methods: EcoCash, InnBucks and Omari through Pesepay; OneMoney, POS2U and
  Telecash initiate Paynow's hosted checkout. Paynow controls merchant method
  availability on its hosted page; no undocumented method-preselection parameter
  is assumed.
- Only USD initiations are allowed. ZiG is visible as a disabled option. Existing
  transaction status remains accessible.
- The logo introduction runs once in the specified order. Pointer movement,
  keyboard activity or touch cancels it permanently for the tab. Reduced motion,
  data-saving, slow-connection signals or poor measured frame delivery skip it.
- Payment details reveal from 50% opacity with an 18px translation, only when
  motion is permitted. No card number, PIN or CVV is collected by Opus.
- Receipts require independent authenticated provider verification. Ambiguous
  initiations never retry; redirects and poll destinations are constrained.
- The 1200 × 630 social image keeps the full logo inside safe margins. WhatsApp
  preview caching is controlled by WhatsApp; the page supplies Open Graph tags.

## Build and verify

Use Node 22 and the existing checkout. Never run the guarded legacy full-site
build for this release.

```
npm run typecheck
npm run test:reconstructed
npm run build:checkout
npm run test:checkout:artifacts
# Bundle payment handlers into /tmp/opus-payments-test as in CI, then:
node scripts/test-payments.cjs
npm run test:paynow
# Start the isolated local design preview in another terminal:
# npm run preview:checkout
# All payment requests are disabled there. It serves the release assets over
# the unchanged production/pages-assets fallback at port 8788.
npm run test:checkout:browser
```

The release generator compiles only PaymentCheckout and its dependencies into
published Next module 3196, using the existing React and JSX runtime modules.
It renders matching checkout HTML, updates the RSC chunk reference and links
scoped checkout CSS. All original 459 paths and protected admin asset hashes
remain available. No supporting Worker is redeployed.

`deploy-opus-pay.py` pins the previous active deployment, checks all four
supporting Worker versions, payment binding names, the existing database schema,
asset hashes and the pushed clean source commit. It applies no migrations and
exports no credentials. Default invocation is a read-only preflight; `--preview`
uses an isolated preview branch. `--activate` inherits production bindings.
Never enable the guarded automatic Next deployment.

## Artwork provenance

Existing merchant/provider PNG/WebP assets are reused from the checkout. Visa
uses the Simple Icons vector path; Mastercard uses the original vector artwork
from gilbarbara/logos with a horizontal lockup. POS2U is a lightweight vector
wordmark reconstruction pending an original downloadable vector. The supplied
chat images are visual references; their original attachment files are not
mounted in this workspace. The merchant lockup now uses the unmodified owner-supplied official JPEG; see
`docs/OPUS-PAY-ARTWORK.md` for its checksum and display viewport. Poppins' OFL license is shipped with the fonts.

## Compact responsive revision

The selector now caps desktop card width at 820px. Surface heights, logo artwork,
heading sizes and header/footer spacing shrink together on short windows and
small screens. The merchant logo uses upright lettering with no added skew or
italic styling. `npm run test:checkout:viewports` checks 13 sizes from 320×568 to
1920×1080, including a 1280×640 desktop viewport representative of browser zoom.
All initial selectors fit without scrolling at those tested sizes. Compact payment
details use focused steps that also fit when the mobile keyboard is open.

## One-screen payment details

Small or short screens present reference, amount, phone when needed, optional
receipt contact, optional payer name and review as focused steps. State persists
across steps; initiation occurs only from the final review. The form follows
visualViewport height changes, including the mobile keyboard. Required fields,
errors and the final action are verified visible rather than merely clipped.
Issued receipt documents retain their accessible document layout.
Run `npm run test:checkout:no-scroll` for these cases.
