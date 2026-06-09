import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TeamClient from '@/components/TeamClient'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: members } = await supabase.from('team_members').select('*').order('name')

  return (
    <AppShell>
      <TeamClient initialMembers={members ?? []} />
    </AppShell>
  )
}
