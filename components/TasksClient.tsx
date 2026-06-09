'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low']
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done']
const empty = { title: '', assigned_to: '', due_date: '', priority: 'Medium' as TaskPriority, status: 'To Do' as TaskStatus, client_id: '', engagement_id: '' }
type ClientOpt = { id: string; name: string; engagements: { id: string; name: string }[] }

const PRIORITY_DOT: Record<string, string> = { High: 'bg-red-500', Medium: 'bg-amber-400', Low: 'bg-blue-400' }

function sortTasks(tasks: Task[], today: string) {
  const o = (t: Task) => { if (t.status === 'Done') return 4; if (t.due_date && t.due_date < today) return 0; if (t.due_date === today) return 1; if (t.due_date) return 2; return 3 }
  return [...tasks].sort((a, b) => o(a) - o(b) || (a.due_date ?? '').localeCompare(b.due_date ?? ''))
}
function fmt(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

const Toggle = ({ opts, val, set }: { opts: string[]; val: string; set: (v: string) => void }) => (
  <div className="flex gap-1.5">
    {opts.map(o => (
      <Button key={o} type="button" variant={val === o ? 'default' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => set(o)}>{o}</Button>
    ))}
  </div>
)

export default function TasksClient({ initialTasks, clients }: { initialTasks: Task[]; clients: ClientOpt[] }) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All')

  const sorted = useMemo(() => sortTasks(tasks, today), [tasks, today])
  const filtered = filterStatus === 'All' ? sorted : sorted.filter(t => t.status === filterStatus)
  const overdueCount = sorted.filter(t => t.due_date && t.due_date < today && t.status !== 'Done').length
  const engagements = clients.find(c => c.id === form.client_id)?.engagements ?? []

  function openAdd() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(t: Task) {
    setEditing(t)
    setForm({ title: t.title, assigned_to: t.assigned_to, due_date: t.due_date ?? '', priority: t.priority, status: t.status, client_id: t.client_id ?? '', engagement_id: t.engagement_id ?? '' })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const p = { title: form.title, assigned_to: form.assigned_to, due_date: form.due_date || null, priority: form.priority, status: form.status, client_id: form.client_id || null, engagement_id: form.engagement_id || null }
    if (editing) {
      const { data } = await supabase.from('tasks').update(p).eq('id', editing.id).select('*, client:clients(id,name), engagement:engagements(id,name)').single()
      if (data) setTasks(prev => prev.map(t => t.id === editing.id ? data : t))
    } else {
      const { data } = await supabase.from('tasks').insert(p).select('*, client:clients(id,name), engagement:engagements(id,name)').single()
      if (data) setTasks(prev => [...prev, data])
    }
    setSaving(false); setShowForm(false)
  }

  async function del(t: Task) { await supabase.from('tasks').delete().eq('id', t.id); setTasks(p => p.filter(x => x.id !== t.id)); setDelTarget(null) }

  async function toggleDone(t: Task, e: React.MouseEvent) {
    e.stopPropagation()
    const ns: TaskStatus = t.status === 'Done' ? 'To Do' : 'Done'
    const { data } = await supabase.from('tasks').update({ status: ns }).eq('id', t.id).select('*, client:clients(id,name), engagement:engagements(id,name)').single()
    if (data) setTasks(p => p.map(x => x.id === t.id ? data : x))
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground font-medium">StrideWorks</p>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          {overdueCount > 0 && <p className="text-xs text-destructive font-semibold mt-0.5">{overdueCount} overdue</p>}
        </div>
        <Button size="sm" onClick={openAdd}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Task
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
        {(['All', ...STATUSES] as const).map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? 'default' : 'outline'}
            className="shrink-0 text-xs h-7 px-2.5" onClick={() => setFilterStatus(s)}>
            {s} <span className="ml-1 opacity-60 text-[10px]">{s === 'All' ? tasks.length : tasks.filter(t => t.status === s).length}</span>
          </Button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No tasks</p>}
          {filtered.map((t, i) => {
            const isOverdue = t.due_date && t.due_date < today && t.status !== 'Done'
            const isToday = t.due_date === today && t.status !== 'Done'
            const isDone = t.status === 'Done'
            return (
              <div key={t.id}>
                {i > 0 && <Separator />}
                <div onClick={() => openEdit(t)} className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors ${isOverdue ? 'bg-destructive/5' : isToday ? 'bg-amber-50/50' : ''}`}>
                  <button onClick={e => toggleDone(t, e)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-emerald-600 border-emerald-600' : 'border-border hover:border-muted-foreground'}`}>
                    {isDone && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {t.assigned_to && <span className="text-xs text-muted-foreground">{t.assigned_to}</span>}
                      {(t.client as any)?.name && (
                        <span className="text-xs text-muted-foreground">· {(t.client as any).name}{(t.engagement as any)?.name ? ` / ${(t.engagement as any).name}` : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                      <Badge label={t.priority} />
                    </div>
                    {t.due_date && (
                      <span className={`text-[11px] font-medium ${isOverdue ? 'text-destructive' : isToday ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {isToday ? 'Today' : fmt(t.due_date)}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5 text-muted-foreground/50 hover:text-destructive"
                    onClick={e => { e.stopPropagation(); setDelTarget(t) }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {showForm && (
        <Modal title={editing ? 'Edit Task' : 'New Task'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assigned to</Label>
                <Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} placeholder="Name" />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Toggle opts={PRIORITIES} val={form.priority} set={v => setForm(p => ({ ...p, priority: v as TaskPriority }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Toggle opts={STATUSES} val={form.status} set={v => setForm(p => ({ ...p, status: v as TaskStatus }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Client (optional)</Label>
              <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v as string, engagement_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.client_id && engagements.length > 0 && (
              <div className="space-y-1.5">
                <Label>Engagement (optional)</Label>
                <Select value={form.engagement_id} onValueChange={v => setForm(p => ({ ...p, engagement_id: v as string }))}>
                  <SelectTrigger><SelectValue placeholder="No engagement" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No engagement</SelectItem>
                    {engagements.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={save} disabled={saving || !form.title} className="w-full">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Task'}
            </Button>
          </div>
        </Modal>
      )}

      {delTarget && (
        <Modal title="Delete task?" onClose={() => setDelTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Delete <strong className="text-foreground">{delTarget.title}</strong>?</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => del(delTarget)}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
