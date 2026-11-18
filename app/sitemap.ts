import type { MetadataRoute } from 'next'
import routes from '../ops/site/seo-routes.json'

export default function sitemap(): MetadataRoute.Sitemap {
  // Do not invent modification dates on every build.
  return routes.routes.map(path => ({ url: routes.origin + path }))
}
