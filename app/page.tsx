import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: clients }, { data: rawTasks }, { data: goals }, { data: taskAssignees }, { data: teamMembers }] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('tasks').select('*, client:clients(name), goal:goals(name)').not('status', 'in', '("Approved","Rejected")').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('goals').select('*'),
    supabase.from('task_assignees').select('task_id, team_member_id'),
    supabase.from('team_members').select('*'),
  ])

  const memberMap = Object.fromEntries((teamMembers ?? []).map(m => [m.id, m]))
  const tasks = (rawTasks ?? []).map(t => ({
    ...t,
    assignees: (taskAssignees ?? [])
      .filter(ta => ta.task_id === t.id)
      .map(ta => memberMap[ta.team_member_id])
      .filter(Boolean),
  }))

  const activeClients = (clients ?? []).filter(c => c.status === 'Active').length
  const overdueCount = tasks.filter(t => t.due_date && t.due_date < today).length
  const dueTodayCount = tasks.filter(t => t.due_date === today).length
  const activeGoals = (goals ?? []).length

  return (
    <AppShell>
      <DashboardClient
        stats={{ activeClients, totalClients: (clients ?? []).length, overdueCount, dueTodayCount, activeGoals }}
        recentTasks={tasks.slice(0, 8)}
        today={today}
      />
    </AppShell>
  )
}
