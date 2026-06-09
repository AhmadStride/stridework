'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { TeamMember } from '@/lib/types'

const inp = "w-full border border-gray-200 rounded-lg px-3 py-0 h-11 text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gray-400 transition-colors"
const empty = { name: '', email: '', role: 'Member' }
const ROLES = ['Admin', 'Member', 'Viewer']

export default function TeamClient({ initialMembers }: { initialMembers: TeamMember[] }) {
  const supabase = createClient()
  const [members, setMembers] = useState(initialMembers)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState<TeamMember | null>(null)

  function openAdd() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(m: TeamMember) { setEditing(m); setForm({ name: m.name, email: m.email, role: m.role }); setShowForm(true) }

  async function save() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('team_members').update(form).eq('id', editing.id).select().single()
      if (data) setMembers(p => p.map(m => m.id === editing.id ? data : m))
    } else {
      const { data } = await supabase.from('team_members').insert(form).select().single()
      if (data) setMembers(p => [...p, data])
    }
    setSaving(false); setShowForm(false)
  }

  async function del(m: TeamMember) {
    await supabase.from('team_members').delete().eq('id', m.id)
    setMembers(p => p.filter(x => x.id !== m.id))
    setDelTarget(null)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground font-medium">StrideWork</p>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        </div>
        <Button size="sm" onClick={openAdd}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No team members yet</p>}
          {members.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <Separator />}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email} · {m.role}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDelTarget(m)}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {showForm && (
        <Modal title={editing ? 'Edit Member' : 'Add Member'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@agency.com" className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <Button key={r} type="button" size="sm" variant={form.role === r ? 'default' : 'outline'}
                    className="flex-1 text-xs h-9" onClick={() => setForm(p => ({ ...p, role: r }))}>
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={save} disabled={saving || !form.name || !form.email} className="w-full">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </Modal>
      )}

      {delTarget && (
        <Modal title="Remove member?" onClose={() => setDelTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Remove <strong className="text-foreground">{delTarget.name}</strong> from the team?</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => del(delTarget)}>Remove</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
