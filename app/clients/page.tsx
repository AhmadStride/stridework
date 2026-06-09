import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ClientsClient from '@/components/ClientsClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase.from('clients').select('*').order('name')
  const { data: allGoals } = await supabase.from('goals').select('*, tasks(id, title, status)')

  // Attach goals (with tasks) to each client
  const clientsWithGoals = (clients ?? []).map(c => ({
    ...c,
    goals: (allGoals ?? []).filter(g => g.client_id === c.id),
  }))

  return (
    <AppShell>
      <ClientsClient initialClients={clientsWithGoals} />
    </AppShell>
  )
}
