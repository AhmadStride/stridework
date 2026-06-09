'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/Badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Client, Engagement, EngagementType, EngagementVertical, EngagementStatus } from '@/lib/types'

const TYPES: EngagementType[] = ['Retainer', 'Project']
const VERTICALS: EngagementVertical[] = ['Creative', 'Ads', 'Tech']
const STATUSES: EngagementStatus[] = ['Active', 'Completed']
const empty = { name: '', type: 'Retainer' as EngagementType, vertical: 'Ads' as EngagementVertical, status: 'Active' as EngagementStatus }

const Toggle = ({ opts, val, set }: { opts: string[]; val: string; set: (v: string) => void }) => (
  <div className="flex gap-2">
    {opts.map(o => (
      <Button key={o} type="button" variant={val === o ? 'default' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => set(o)}>
        {o}
      </Button>
    ))}
  </div>
)

export default function EngagementsPanel({ client, engagements, onChange }: { client: Client; engagements: Engagement[]; onChange: (e: Engagement[]) => void }) {
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Engagement | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(e: Engagement) { setEditing(e); setForm({ name: e.name, type: e.type, vertical: e.vertical, status: e.status }); setShowForm(true) }

  async function save() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('engagements').update(form).eq('id', editing.id).select().single()
      if (data) onChange(engagements.map(e => e.id === editing.id ? data : e))
    } else {
      const { data } = await supabase.from('engagements').insert({ ...form, client_id: client.id }).select().single()
      if (data) onChange([...engagements, data])
    }
    setSaving(false); setShowForm(false)
  }

  async function del(e: Engagement) {
    await supabase.from('engagements').delete().eq('id', e.id)
    onChange(engagements.filter(x => x.id !== e.id))
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Google Ads" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Toggle opts={TYPES} val={form.type} set={v => setForm(p => ({ ...p, type: v as EngagementType }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Vertical</Label>
          <Toggle opts={VERTICALS} val={form.vertical} set={v => setForm(p => ({ ...p, vertical: v as EngagementVertical }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Toggle opts={STATUSES} val={form.status} set={v => setForm(p => ({ ...p, status: v as EngagementStatus }))} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button className="flex-1" disabled={saving || !form.name} onClick={save}>
            {saving ? 'Saving…' : editing ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">{engagements.length} Engagement{engagements.length !== 1 ? 's' : ''}</p>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openAdd}>
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add
        </Button>
      </div>
      {engagements.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">No engagements yet</p>
          <Button variant="link" size="sm" onClick={openAdd} className="mt-1 h-auto p-0 text-xs">Add one</Button>
        </div>
      )}
      <div className="space-y-2">
        {engagements.map(e => (
          <div key={e.id} className="border rounded-lg px-3.5 py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{e.name}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Badge label={e.type} />
                  <Badge label={e.vertical} />
                  <Badge label={e.status} />
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => del(e)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
