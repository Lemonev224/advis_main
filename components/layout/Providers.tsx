'use client'

import { LocaleProvider } from "@/lib/supabase/locale-context"
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import NavigationProgress from '@/components/NavigationProgress'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </LocaleProvider>
  )
}