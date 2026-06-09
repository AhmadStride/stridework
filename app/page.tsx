import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const [{ data: clients }, { data: tasks }, { data: engagements }] = await Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, client:clients(name), engagement:engagements(name)').neq('status', 'Done').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('engagements').select('*').eq('status', 'Active'),
  ])

  const activeClients = (clients ?? []).filter(c => c.status === 'Active').length
  const overdueCount = (tasks ?? []).filter(t => t.due_date && t.due_date < today).length
  const dueTodayCount = (tasks ?? []).filter(t => t.due_date === today).length

  return (
    <AppShell>
      <DashboardClient
        stats={{ activeClients, totalClients: (clients ?? []).length, overdueCount, dueTodayCount, activeEngagements: (engagements ?? []).length }}
        recentTasks={(tasks ?? []).slice(0, 8)}
        today={today}
      />
    </AppShell>
  )
}
