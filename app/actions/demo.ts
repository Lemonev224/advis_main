'use server'

import { cookies } from 'next/headers'
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from '@/app/actions/demo-constants'

// Add your demo keys here — one per bank / prospect
const VALID_DEMO_KEYS: Record<string, string> = {
  'DEMO-BANK-2024': 'First National Bank',
  'DEMO-FINX-2024': 'FinX Capital',
  'DEMO-TEST-4X27Z1K39R': 'Internal Test',
  // Add more keys as needed
}

export async function activateDemoSession(
  key: string
): Promise<{ success: boolean; bankName?: string }> {
  const trimmed = key.trim().toUpperCase()
  const bankName = VALID_DEMO_KEYS[trimmed]

  if (!bankName) {
    return { success: false }
  }

  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Session cookie — expires when browser closes.
    // Change maxAge to e.g. 60 * 60 * 24 for a 24h demo.
    path: '/',
  })

  return { success: true, bankName }
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE_NAME)
}