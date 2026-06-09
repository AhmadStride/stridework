import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TasksClient from '@/components/TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tasks }, { data: clients }] = await Promise.all([
    supabase.from('tasks').select('*, client:clients(id,name), engagement:engagements(id,name)').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('clients').select('id, name, engagements(id, name)').order('name'),
  ])
  return (
    <AppShell>
      <TasksClient initialTasks={tasks ?? []} clients={clients ?? []} />
    </AppShell>
  )
}
