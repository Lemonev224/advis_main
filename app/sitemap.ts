// app/sitemap.ts
import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic' // Ensures the sitemap is always fresh

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://advisorly.tech'

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    // ... add other public routes like /login, /request-access, etc.
  ]

  // You can also add dynamic routes here by fetching data from your CMS/DB

  return staticRoutes
}