import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import AccountClient from '@/components/AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName = (user.user_metadata?.full_name as string) ?? ''
  const avatarUrl = (user.user_metadata?.avatar_url as string) ?? null

  return (
    <AppShell>
      <AccountClient email={user.email ?? ''} fullName={fullName} avatarUrl={avatarUrl} />
    </AppShell>
  )
}
