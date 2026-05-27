'use client'

import React, { createContext, useContext, useState } from 'react'
import type { Locale } from './i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ca',
  setLocale: () => {},
})

export function LocaleProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
      const cookieVal = match?.[1] as Locale
      if (cookieVal && ['en', 'es', 'ca'].includes(cookieVal)) return cookieVal
    }
    return 'ca'
  })

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