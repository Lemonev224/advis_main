/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://advisorly.tech', // Replace with your actual domain
  generateRobotsTxt: true, // Automatically generate robots.txt
  exclude: [
    // Exclude protected dashboard routes
    '/', // Your middleware protects the root path
    '/obligations',
    '/evidence',
    '/kyc',
    '/sar',
    '/audit-report',
    '/settings',
    // Exclude functional auth routes
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
  },
}