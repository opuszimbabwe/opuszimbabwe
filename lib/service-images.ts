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
export function serviceImage(source: string): string {
  return replacements[source] || source;
}
