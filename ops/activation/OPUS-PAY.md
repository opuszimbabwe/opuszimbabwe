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
- The ordered logo-shadow cue runs twice initially, waits 15 seconds, then
  repeats continuously while idle. Pointer, keyboard, touch or wheel activity
  pauses it and restarts the 15-second timer. Hidden tabs, reduced motion and
  data saving suspend it. `test:checkout:floating` verifies this with a clock.
- Payment details reveal over two seconds from 50% opacity and a 24px translation, only when
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
mounted in this workspace. The merchant lockup uses a transparent derivative of the owner-supplied JPEG; see
`docs/OPUS-PAY-ARTWORK.md` for its checksum and display viewport. Poppins' OFL license is shipped with the fonts.

## Compact responsive revision

The selector now caps desktop card width at 820px. Surface heights, logo artwork,
heading sizes and header/footer spacing shrink together on short windows and
small screens. The merchant logo uses upright lettering with no added skew or
italic styling. `npm run test:checkout:viewports` checks 13 sizes from 320×568 to
1920×1080, including a 1280×640 desktop viewport representative of browser zoom.
All initial selectors fit without scrolling at those tested sizes. Compact payment
details stay together in a compact form that also fits the tested keyboard viewport.

## One-screen payment details

All fields remain together in one compact responsive form. There is no step
navigation: reference, amount/currency, mobile number where needed, optional
total and provider handoff stay visible together. Optional entry fields are hidden. Small
screens reduce spacing and use columns; visualViewport tracks the keyboard.
Issued receipt documents retain their accessible document layout.
Run `npm run test:checkout:no-scroll` for visibility and no-step assertions.

CSS form reveal runs from 50% opacity and a 24px offset over two seconds,
with a gentle trailing ease. The one-time logo cue dwells 500ms per method. Reduced
motion and explicit data saving disable it. Estimated network speed does not
predict local CSS animation performance; introductory frame sampling only
cancels the logo cue, rather than permanently disabling later form reveals.

## Compact details and restrained validation

Details use a 520px surface, 13px desktop control text, smaller labels and
viewport-height breakpoints for short desktops and browser zoom. Mobile inputs
retain 16px text to avoid automatic focus zoom. All fields remain on one form.
Validation is evaluated for safety continuously, but advice appears after blur
in one status area beside the total. Editing clears displayed advice, and
routine network hints are omitted. Eleven detail sizes, including 892×530, 768×432
and the 390×300 keyboard viewport, check the whole form and visible footer,
not just the submit button. EcoCash invalid-number feedback must also fit.

## Balanced field spacing

Where height permits, details use a 560px card, 38–40px controls, larger interior
padding, a 5px label gap and 9–12px row gaps. Mobile inputs retain 16px text.
Short desktops at least 850px wide gain a 600px two-column form so 38px controls
fit without clipping. Tiny and keyboard viewports retain compact fallbacks.

## Floating fields and layered method cards

Only required fields are rendered in the entry form: reference, amount/currency
and mobile number when required by the selected method. Optional name/email
state is retained for pre-existing orders/attempts but no optional inputs appear.
OpusFloatingField centres input text and idle captions; focus/content floats the
caption to the top-left outline with a solid white break behind it. A 3.6-second
red–orange SVG stroke traces from the left label cut to the right cut on focus,
accelerating into the final segment. It draws once per click/focus. Valid local values turn green on blur;
this is input validation, never a gateway/payment confirmation. Invalid blur
shakes the field and displays a dismissible, 5.5-second white notification.
Reduced-motion/data-saving settings disable decorative animations.

Desktop hover layers one method family above the other. Leaving that card's stable hover zone or
pressing Escape restores both. Touch controls choose Cards, Mobile wallets or
Show both; returning from the form starts with both displayed. Keyboard focus
can bring a method family forward. The custom currency picker retains native
semantics and the disabled ZiG option. No PAN/CVV/PIN fields are collected.

Run `npm run test:checkout:floating`, `test:checkout:no-scroll`,
`test:checkout:browser` and `test:checkout:viewports` against the preserved runtime.

Desktop hover now nudges the upper card 12px down and the lower card 12px up
toward the centre. Stable untransformed zones avoid edge jitter and restore
both families when the pointer moves into the gap, without requiring it to
leave the entire picker. Touch group switching retains its explicit controls.

The stronger orange glow follows the same trace. Completed valid fields use a
2px green border without tick icons. Empty amount/mobile fields show centred
examples only while focused, after their labels float out of the way. Examples
are placeholders, never values. Reference meaning, required status, label and
example remain unchanged pending the owner's discussion. Reduced-motion and
data-saving modes show the focus stroke immediately without tracing.

Chooser resilience checks cover server errors, invalid JSON, malformed method
records, empty method lists, a 15-second GET timeout and manual retry recovery.
No unverified configuration enables payment initiation. Provider image failures
show readable method names rather than broken image icons; an online event retries
artwork. The two group surfaces remain mounted in loading/error states, layering
resets on failure and decorative cues pause. `test:checkout:loading` exercises
these conditions without gateway requests. The authorisation paragraph spans
the form width and is explicitly centred on desktop and mobile.
