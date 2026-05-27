// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminLayoutClient from './AdminLayoutClient'

const SUPER_ADMIN_EMAILS = [
  'limonovarseniy491@gmail.com', // ← your email
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !SUPER_ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/landing')
  }

  return (
    <AdminLayoutClient email={user.email ?? ''}>
      {children}
    </AdminLayoutClient>
  )
}