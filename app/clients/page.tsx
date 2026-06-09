import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ClientsClient from '@/components/ClientsClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase.from('clients').select('*, engagements(*)').order('name')
  return (
    <AppShell>
      <ClientsClient initialClients={clients ?? []} />
    </AppShell>
  )
}
