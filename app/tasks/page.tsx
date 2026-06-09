import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TasksClient from '@/components/TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawTasks }, { data: clients }, { data: teamMembers }, { data: taskAssignees }] = await Promise.all([
    supabase.from('tasks').select('*, client:clients(id,name), goal:goals(id,name)').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('clients').select('id, name, goals(id, name, vertical)').order('name'),
    supabase.from('team_members').select('*').order('name'),
    supabase.from('task_assignees').select('task_id, team_member_id'),
  ])

  // Attach assignees to each task
  const memberMap = Object.fromEntries((teamMembers ?? []).map(m => [m.id, m]))
  const tasks = (rawTasks ?? []).map(t => ({
    ...t,
    assignees: (taskAssignees ?? [])
      .filter(ta => ta.task_id === t.id)
      .map(ta => memberMap[ta.team_member_id])
      .filter(Boolean),
  }))

  return (
    <AppShell>
      <TasksClient
        initialTasks={tasks}
        clients={clients ?? []}
        teamMembers={teamMembers ?? []}
        currentUserEmail={user.email ?? ''}
      />
    </AppShell>
  )
}
