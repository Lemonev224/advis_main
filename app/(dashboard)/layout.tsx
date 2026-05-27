// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from '@/app/actions/demo-constants'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isDemoSession = cookieStore.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE

  if (!isDemoSession) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/landing')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  )
}