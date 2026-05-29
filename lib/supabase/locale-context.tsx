'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Locale } from './i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ca',
  setLocale: () => {},
})

function getLocaleCookie(): Locale {
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  const cookieVal = match?.[1] as Locale
  if (cookieVal && ['en', 'es', 'ca'].includes(cookieVal)) return cookieVal
  return 'ca'
}

export function LocaleProvider({ children }: { children: React.ReactNode }): JSX.Element {
  // Always start with 'ca' to match the server render
  const [locale, setLocaleState] = useState<Locale>('ca')
  // After mount, sync to the actual cookie value
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocaleState(getLocaleCookie())
    setMounted(true)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000`
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}