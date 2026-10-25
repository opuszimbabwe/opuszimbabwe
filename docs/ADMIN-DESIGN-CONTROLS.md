# Admin colours, uploads and independent service placements

All font controls retain Poppins. Existing saved media is used as the starting
point; no replacement artwork or customer design values are published by this release.

## Colour and gradients

Colour controls accept RGB, RGBA, transparent and 3/4/6/8-digit hex. Expand RGBA
to edit R/G/B (0–255) and alpha (0–1). `rgba(0, 0, 0, 0)` is fully transparent.
The checkerboard indicates transparency. Alpha on an individual colour combines
with the opacity of its containing overlay.

Gradient controls support 2–12 stops. Add/remove/reorder colours, set optional
positions, edit the angle, and give every colour its own alpha. Full
`linear-gradient(...)` and angle/stops CSS can be pasted; previews and saved values
use the same strict parser. URLs, variables and arbitrary CSS functions are rejected.
These controls are shared by the home hero, section backgrounds, graphic-design
classes and the service placement editor.

## Home hero layers

In Home Hero Design → Background & overlay choose No background image, Static
background image, or Rotating background images. Foreground service/text rotation
is configured separately in Rotation & animation. Both layers can rotate together;
static background + rotating foreground is supported too. Background slides and
foreground service-cycle images remain separate. Pause, hover pause and reduced
motion stop both moving layers. Editing previews remain paused intentionally.

Old saved heroes retain their initial displayed background and rotation behaviour.
New fields are added by the normalizer; no blanket hero settings update is needed.

## Local image uploads

Every Upload action opens the same accessible image dialog: browse, drop, or paste
an image. Image fields, hero image controls, graphic classes and service placements
also offer direct focusable drop/paste areas. Ordinary pasted text is unaffected.
Only one file is accepted per control, at most 5 MB, using the server’s existing
image formats. Dropping outside a selected control cannot navigate away or upload
to a previously selected field. Uploads still require the existing admin access.
Uploaded images update drafts; save the relevant section to publish them.

## Service images and card appearance

Services → choose a service → Images & card appearance by placement:

- Homepage service card
- Services overview card
- Individual page hero
- Individual page showcase and its additional slide images
- Individual page supporting illustration

Every placement stores its own image, solid/gradient background, overlay and image
fit. Cards and heroes containing text also expose title colour, paragraph colour
and alignment. The overview supports split artwork or full background images.
Graphic design uses its category artwork instead of the removed post-hero showcase;
that unused placement is excluded from its editor.

Home hero foreground images, project screenshots, partner logos and graphic-design
category artwork retain their own independent existing controls. Showcase images
are copied into their placement defaults, so later project screenshot edits do not
change a service showcase.

Save [service] commits copy, legacy metadata and that service’s five placements
in one D1 batch. Invalid data causes no partial save; another service’s unsaved
placements cannot overwrite its saved appearances. Content revision and no-store
public refresh behaviour remain in place.

## Initial placement snapshot

Before publishing the first release of these controls, snapshot the fresh public
content into the new settings namespace. This freezes formerly shared defaults
without changing their current files. Back up D1 first.

```bash
curl --fail --silent --show-error https://opuszim.co.zw/api/content --output /tmp/opus-current-content.json
node_modules/.bin/esbuild scripts/initialize-service-presentations.ts --bundle --platform=node --format=cjs --outfile=/tmp/opus-initialize-presentations.cjs
node /tmp/opus-initialize-presentations.cjs /tmp/opus-current-content.json /tmp/opus-presentations.sql
npx wrangler d1 execute opuszim-content --remote --file=/tmp/opus-presentations.sql
```

The generated SQL merges only missing defaults; existing saved placements win.
No database schema migration, payment configuration change or live charge is needed.
