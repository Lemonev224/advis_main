import { cookies } from 'next/headers'
import { Locale } from './i18n'

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
    if (localeCookie && ['en', 'es', 'ca'].includes(localeCookie)) {
      return localeCookie as Locale
    }
  } catch (e) {
    // cookies() throws if called outside of Server Component request context
  }
  return 'ca'
}