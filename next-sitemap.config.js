/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://advisorly.tech',
  generateRobotsTxt: true,
  generateIndexSitemap: false,        // ← this is the key: no index file
  outDir: './public',                 // ensures sitemap.xml goes to public/
  exclude: [
    // exclude protected routes
    '/',
    '/obligations',
    '/evidence',
    '/kyc',
    '/sar',
    '/audit-report',
    '/settings',
    '/auth/*',
    '/login'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/obligations',
          '/evidence',
          '/kyc',
          '/sar',
          '/audit-report',
          '/settings',
          '/auth'
        ],
      },
    ],
    additionalSitemaps: [],           // no extra sitemaps
  },
}