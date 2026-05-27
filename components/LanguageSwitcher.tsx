'use client'

import { useLocale } from '@/lib/supabase/locale-context'
import type { Locale } from '@/lib/supabase/i18n'

const labels: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
  ca: 'CA',
}

export default function LanguageSwitcher({ variant = 'dark' }: { variant?: 'light' | 'dark' }) {
  const { locale, setLocale } = useLocale()

  return (
    <select
      value={locale}
      onChange={e => setLocale(e.target.value as Locale)}
      className={`bg-transparent text-xs font-bold uppercase tracking-widest rounded px-2 py-1 cursor-pointer focus:outline-none transition-colors ${
        variant === 'dark' 
          ? 'text-[#ECF0F1]/70 hover:text-white border border-white/20' 
          : 'text-gray-600 hover:text-gray-900 border border-gray-300'
      }`}
    >
      {(Object.keys(labels) as Locale[]).map(l => (
        <option key={l} value={l} className="bg-white text-gray-900">
          {labels[l]}
        </option>
      ))}
    </select>
  )
}