// Refresh only bundled legacy illustrations. Admin uploads and external URLs
// remain exactly as selected, including deliberately empty media fields.
const replacements: Record<string, string> = {};
const images = [
  ['website-design', 'web-design', 'website-devices.jpg'],
  ['software-systems', 'software', 'software-code.jpg'],
  ['ai-automation', 'ai', 'automation-workspace.jpg'],
  ['graphic-design', 'graphic', 'brand-stationery.jpg'],
  ['domains-hosting', 'hosting', 'hosting-servers.png'],
  ['api-integrations', 'api', 'integrations-workspace.jpg'],
];
for (const [hero, service, file] of images) {
  const target = `/images/editorial/${file}`;
  replacements[`/images/hero-${hero}.png`] = target;
  replacements[`/images/service-${service}.${['web-design', 'graphic', 'hosting'].includes(service) ? 'png' : 'jpg'}`] = target;
}
// Previously published studio images and the existing service-card uploads.
// Match exact versions so subsequent admin replacements still take precedence.
const publishedImages = [
  ['website', 'img_66e1cc2995aa4eb2958c.png', 'website-devices.jpg'],
  ['software', 'img_d882a10794f746459c23.jpg', 'software-code.jpg'],
  ['automation', 'img_9a6cc9c20d1e4a5c9a71.jpg', 'automation-workspace.jpg'],
  ['branding', 'img_5c9ee02ccef046ae9dda.jpg', 'brand-stationery.jpg'],
  ['hosting', 'img_4e0582a3a6d34e21a0ed.jpg', 'hosting-servers.png'],
  ['integrations', 'img_33fccc48dd294464be66.jpg', 'integrations-workspace.jpg'],
];
for (const [studio, upload, file] of publishedImages) {
  replacements[`/images/hero-studio/${studio}-v1.webp`] = `/images/editorial/${file}`;
  replacements[`/api/media/${upload}`] = `/images/editorial/${file}`;
}
export function serviceImage(source: string): string {
  return replacements[source] || source;
}
