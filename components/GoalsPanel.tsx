'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Badge from '@/components/Badge'
import type { Client, Goal, GoalVertical, Task } from '@/lib/types'

const VERTICALS: GoalVertical[] = ['Ads', 'Tech', 'Creative']

const emptyForm = { name: '', description: '', start_date: '', end_date: '' }

const inp = "w-full border border-gray-200 rounded-lg px-3 py-0 h-11 text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gray-400 transition-colors"

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
      <div
        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const tasks = goal.tasks ?? []
  const approved = tasks.filter(t => t.status === 'Approved').length
  const progress = tasks.length > 0 ? Math.round((approved / tasks.length) * 100) : 0

  const fmt = (d: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{goal.name}</p>
            {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
            {(goal.start_date || goal.end_date) && (
              <p className="text-xs text-muted-foreground mt-1">
                {fmt(goal.start_date)} {goal.start_date && goal.end_date && '→'} {fmt(goal.end_date)}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Progress</span>
            <span className="text-[11px] font-bold text-gray-700">{progress}% <span className="text-muted-foreground font-normal">({approved}/{tasks.length} approved)</span></span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </div>

      {/* Tasks under goal */}
      {tasks.length > 0 && (
        <>
          <Separator />
          <div className="divide-y divide-gray-100">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2 bg-gray-50/50">
                <p className="text-xs text-gray-700 truncate flex-1">{t.title}</p>
                <Badge label={t.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function GoalsPanel({ client, goals, onChange }: {
  client: Client
  goals: Goal[]
  onChange: (goals: Goal[]) => void
}) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<GoalVertical>('Ads')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const tabGoals = goals.filter(g => g.vertical === activeTab)

  function openAdd() { setEditing(null); setForm(emptyForm); setShowForm(true) }
  function openEdit(g: Goal) {
    setEditing(g)
    setForm({ name: g.name, description: g.description, start_date: g.start_date ?? '', end_date: g.end_date ?? '' })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = { name: form.name, description: form.description, start_date: form.start_date || null, end_date: form.end_date || null, vertical: activeTab, client_id: client.id }
    if (editing) {
      const { data } = await supabase.from('goals').update(payload).eq('id', editing.id).select().single()
      if (data) onChange(goals.map(g => g.id === editing.id ? { ...editing, ...data } : g))
    } else {
      const { data } = await supabase.from('goals').insert(payload).select().single()
      if (data) onChange([...goals, { ...data, tasks: [] }])
    }
    setSaving(false); setShowForm(false)
  }

  async function deleteGoal(g: Goal) {
    await supabase.from('goals').delete().eq('id', g.id)
    onChange(goals.filter(x => x.id !== g.id))
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge label={activeTab} />
          <p className="text-sm font-semibold">{editing ? 'Edit Goal' : 'New Goal'}</p>
        </div>
        <div className="space-y-1.5">
          <Label>Goal name</Label>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Increase ROAS to 4x" className={inp} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className={inp} />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className={inp} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button className="flex-1" disabled={saving || !form.name} onClick={save}>
            {saving ? 'Saving…' : editing ? 'Save' : 'Add Goal'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Vertical tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
        {VERTICALS.map(v => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {tabGoals.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-xl">
            <p className="text-sm text-muted-foreground">No goals for {activeTab} yet</p>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={openAdd}>
              Add first goal
            </Button>
          </div>
        )}
        {tabGoals.map(g => (
          <GoalCard key={g.id} goal={g} onEdit={() => openEdit(g)} onDelete={() => deleteGoal(g)} />
        ))}
        {tabGoals.length > 0 && (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={openAdd}>
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Goal
          </Button>
        )}
      </div>
    </div>
  )
}
