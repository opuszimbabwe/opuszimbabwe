# Reference study — 16 November 2026

These observations came from fresh Chromium visits at 1440px and 390px, with
screenshots captured before/after scrolling and interactive checks. Evidence is
retained locally in `/workspace/scratch/deolume-research/`; no third-party brand
artwork, client imagery, licensed typefaces, testimonials or source code was copied.

## 10Clouds / main direction

https://www.10clouds.design/
https://www.10clouds.design/visual-design

The homepage uses a light field and three very large stacked statements
(“Discover, Design, Stand out”), measured at 210px at the reference desktop width.
A 3D presentation occupies the lower hero. On scrolling, the visual object and
text create a continuous composition. A circular scroll prompt rotates. Dark
project sections pair very large visuals with editorial copy, switching image and
copy sides. Thin outlined capability pills accompany each case study. Deeper
sections expand into large, rather than card-sized, statements.

The visual-design page begins on a near-black field with an 80px headline,
an offset colour highlight and a large rounded CTA. A looping capability strip
bridges into an expansive media position. The following light section uses a
60px editorial statement and a hand-drawn-looking highlight. Its contrast and
rhythm are stronger than a uniform grid of small service cards. The reference
loads Webflow interaction code, CSS marquees and Vimeo iframes; absence of a
native video element does not mean it lacks video. The homepage loading overlay
needed roughly 14 seconds to settle here; this build introduces no such gate.

Applied as principles: oversized type with scroll movement, a geometric motion
scene, alternating full-width tonal sections, editorial project presentations,
a scrolling capability strip and a native-scroll-driven horizontal service scene.
The bespoke Deolume artwork is CSS/vector typography. It is not a fabricated
photograph or a substitute client video. A supplied film can later occupy the
same stage; there is currently no video file or external media embed.

## Coca-Cola / property and construction

https://www.coca-cola.com/xe/en

The observed page uses a generous light background, a large rounded photographic
carousel with adjacent slides peeking at the edges, overlaid white headlines,
wide pill CTAs and position indicators. Subsequent image/text compositions
create depth through overlapping panels. The cookie interface has an explicit
“Only Necessary” choice. This page was less animation-heavy than the brief
might suggest; its strength is photography, scale and controlled slide changes.

Applied: a three-image property carousel with native touch scrolling, arrows and
working position dots; real locally hosted architecture photographs; an overlapping
editorial image/copy composition; contextual property enquiry links. Reference
photographs are labelled separately from actual Opus Zimbabwe project work.

## Netflix / graphic design

https://www.netflix.com/zw/

Observed: a darkened angled poster collage behind a centred conversion message,
a curved divider, a horizontally browsed poster rail with next controls,
hover emphasis, large indices and expandable FAQ answers. The “What is Netflix?”
control was clicked and its aria-expanded state changed to true. The imagery
and browsing model are more important here than constant decorative movement.

Applied: an original angled typographic poster wall, a gently moving backdrop,
a native poster rail, accessible filters, full concept detail dialogs and FAQ
expansion. Every poster is original Deolume concept artwork. No Netflix artwork,
show titles, claims or trademarks are reused.

## PayPal / not verified

https://www.paypal.com/zw/home

The actual browser request returned HTTP 403. Its current animation, layout and
interactions were not inspected successfully and are not claimed as reproduced.
The digital page uses an independently designed clear content hierarchy,
responsive interface composition and a three-step keyboard-operated explanation.

## Motion rules

- Native scrolling stays native; no wheel/touch interception or scroll hijacking.
- Scroll-driven type, stage expansion and horizontal services run at most once
  per animation frame, scheduled by scroll/resize events.
- Continuous decorative motion can be paused for the tab and is stopped by the
  OS reduced-motion setting. Hidden tabs pause decorative animation.
- Mobile horizontal galleries use native touch scrolling and snap points.
- Page transitions use native cross-document View Transitions where supported;
  ordinary links remain the fallback.
- Native dialogs retain Escape, focus containment/restoration and background
  scroll locking. Text remains available without reveal JavaScript.

## Deeper homepage pass

The 10Clouds homepage was also inspected around scroll positions 6,500, 9,500,
12,500, 15,500, 18,500 and 21,300px. Its values presentation stays in view across
multiple scroll intervals while the 3D ribbon changes composition and the copy
moves between chapters. The later service area uses wide outlined rows, the
client area uses a horizontal presentation, and the large “Brains at work” line
has a measured horizontal transform. These later scenes reinforce the choice
of a pinned Deolume motion stage and native-scroll service presentation rather
than merely fading a row of cards into view. PayPal was retried with a standard
Chrome user agent and still returned HTTP 403.
