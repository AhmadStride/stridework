'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import GoalsPanel from '@/components/GoalsPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Client, ClientStatus, Goal } from '@/lib/types'

type ClientWithGoals = Client & { goals: Goal[] }

const STATUSES: ClientStatus[] = ['Active', 'On Hold', 'Completed', 'Closed']
const FILTER = ['All', 'Active', 'On Hold', 'Completed'] as const

const inp = "w-full border border-gray-200 rounded-lg px-3 py-0 h-11 text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gray-400 transition-colors"

function initials(n: string) { return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
const COLORS = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-orange-100 text-orange-700','bg-rose-100 text-rose-700','bg-cyan-100 text-cyan-700']
function avatarCls(n: string) { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % COLORS.length; return COLORS[h] }

const empty = { name: '', contact_name: '', phone: '', email: '', status: 'Active' as ClientStatus }

export default function ClientsClient({ initialClients }: { initialClients: ClientWithGoals[] }) {
  const supabase = createClient()
  const [clients, setClients] = useState(initialClients)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<ClientWithGoals | null>(null)
  const [delTarget, setDelTarget] = useState<Client | null>(null)
  const [filter, setFilter] = useState<typeof FILTER[number]>('All')
  const [search, setSearch] = useState('')
  const [showClosed, setShowClosed] = useState(false)

  const filtered = clients
    .filter(c => showClosed ? c.status === 'Closed' : c.status !== 'Closed')
    .filter(c => filter === 'All' || c.status === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.contact_name.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(c: Client, e: React.MouseEvent) {
    e.stopPropagation()
    setEditing(c)
    setForm({ name: c.name, contact_name: c.contact_name, phone: c.phone, email: c.email, status: c.status })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('clients').update(form).eq('id', editing.id).select().single()
      if (data) setClients(p => p.map(c => c.id === editing.id ? { ...c, ...data } : c))
    } else {
      const { data } = await supabase.from('clients').insert(form).select().single()
      if (data) setClients(p => [{ ...data, goals: [] }, ...p])
    }
    setSaving(false); setShowForm(false)
  }

  async function del(c: Client) {
    await supabase.from('clients').delete().eq('id', c.id)
    setClients(p => p.filter(x => x.id !== c.id))
    setDelTarget(null)
    if (selected?.id === c.id) setSelected(null)
  }

  function onGoalsChange(clientId: string, goals: Goal[]) {
    setClients(p => p.map(c => c.id === clientId ? { ...c, goals } : c))
    if (selected?.id === clientId) setSelected(p => p ? { ...p, goals } : p)
  }

  const closedCount = clients.filter(c => c.status === 'Closed').length

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Stridestack</p>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        </div>
        <Button size="sm" onClick={openAdd}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" className="pl-9 h-11" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
        {FILTER.map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
            className="shrink-0 text-xs h-7 px-2.5" onClick={() => { setFilter(f); setShowClosed(false) }}>
            {f}
          </Button>
        ))}
      </div>

      {/* Show closed toggle */}
      {closedCount > 0 && (
        <button onClick={() => { setShowClosed(v => !v); setFilter('All') }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700 mb-3 transition-colors">
          <svg className={`w-3.5 h-3.5 transition-transform ${showClosed ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          {showClosed ? 'Hide' : 'Show'} {closedCount} closed client{closedCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Client list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No clients found</p>
          )}
          {filtered.map((c, i) => (
            <div key={c.id}>
              {i > 0 && <Separator />}
              <div onClick={() => setSelected(c)}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors ${c.status === 'Closed' ? 'opacity-60' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${avatarCls(c.name)}`}>
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <Badge label={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.contact_name} · {c.email}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => openEdit(c, e)}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); setDelTarget(c) }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </Button>
                  <svg className="w-4 h-4 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editing ? 'Edit Client' : 'New Client'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            {([['name','Company name','Acme Inc.'],['contact_name','Contact name','Jane Smith'],['phone','Phone','+1 234 567'],['email','Email','jane@acme.com']] as const).map(([f, l, p]) => (
              <div key={f} className="space-y-1.5">
                <Label>{l}</Label>
                <Input type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
                  value={form[f as keyof typeof form]} onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))}
                  placeholder={p} className={inp} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <Button key={s} type="button" size="sm" variant={form.status === s ? 'default' : 'outline'}
                    className="text-xs h-7" onClick={() => setForm(p => ({ ...p, status: s }))}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={save} disabled={saving || !form.name} className="w-full">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Client'}
            </Button>
          </div>
        </Modal>
      )}

      {delTarget && (
        <Modal title="Delete client?" onClose={() => setDelTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Delete <strong className="text-foreground">{delTarget.name}</strong> and all their data?</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => del(delTarget)}>Delete</Button>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <GoalsPanel
            client={selected}
            goals={selected.goals}
            onChange={g => onGoalsChange(selected.id, g)}
          />
        </Modal>
      )}
    </div>
  )
}
