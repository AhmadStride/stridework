import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import AccountClient from '@/components/AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <AppShell>
      <AccountClient email={user.email ?? ''} />
    </AppShell>
  )
}
