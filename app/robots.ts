import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/sysadmin/', '/api/'] },
    sitemap: 'https://opuszim.co.zw/sitemap.xml',
  }
}
