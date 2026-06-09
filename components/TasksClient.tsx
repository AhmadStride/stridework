'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import FollowUps from '@/components/FollowUps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Task, TaskPriority, TaskStatus, TeamMember, FollowUp, Goal } from '@/lib/types'

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low']
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Approved', 'Rejected']
const ADMIN_ONLY: TaskStatus[] = ['Approved', 'Rejected']

type ClientOpt = { id: string; name: string; goals: { id: string; name: string; vertical: string }[] }

const PRIORITY_DOT: Record<string, string> = { High: 'bg-red-500', Medium: 'bg-amber-400', Low: 'bg-blue-400' }

const STATUS_BG: Partial<Record<TaskStatus, string>> = {
  Approved: 'bg-emerald-50/60',
  Rejected: 'bg-red-50/60',
}

const inp = "w-full border border-gray-200 rounded-lg px-3 py-0 h-11 text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gray-400 transition-colors"

function sortTasks(tasks: Task[], today: string) {
  const o = (t: Task) => {
    if (t.status === 'Approved') return 5
    if (t.status === 'Rejected') return 4
    if (t.due_date && t.due_date < today) return 0
    if (t.due_date === today) return 1
    if (t.due_date) return 2
    return 3
  }
  return [...tasks].sort((a, b) => o(a) - o(b) || (a.due_date ?? '').localeCompare(b.due_date ?? ''))
}

function fmt(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

function AssigneeChips({ assignees }: { assignees: TeamMember[] }) {
  if (!assignees.length) return <span className="text-xs text-muted-foreground">Unassigned</span>
  return (
    <div className="flex gap-1 flex-wrap">
      {assignees.map(a => (
        <span key={a.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
          <span className="w-3.5 h-3.5 rounded-full bg-gray-400 text-white text-[8px] flex items-center justify-center font-bold">
            {a.name.charAt(0).toUpperCase()}
          </span>
          {a.name.split(' ')[0]}
        </span>
      ))}
    </div>
  )
}

const emptyForm = {
  title: '', due_date: '', priority: 'Medium' as TaskPriority,
  status: 'To Do' as TaskStatus, client_id: '', goal_id: '',
  assignee_ids: [] as string[],
}

export default function TasksClient({ initialTasks, clients, teamMembers, currentUserEmail }: {
  initialTasks: Task[]
  clients: ClientOpt[]
  teamMembers: TeamMember[]
  currentUserEmail: string
}) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const currentMember = teamMembers.find(m => m.email === currentUserEmail)

  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<'all' | 'mine'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loadingFU, setLoadingFU] = useState(false)
  const [rejectionModal, setRejectionModal] = useState<Task | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterClient, setFilterClient] = useState('')

  const sorted = useMemo(() => sortTasks(tasks, today), [tasks, today])

  const filtered = sorted.filter(t => {
    if (view === 'mine' && currentMember) {
      if (!t.assignees?.some(a => a.id === currentMember.id)) return false
    }
    if (filterStatus !== 'All' && t.status !== filterStatus) return false
    if (filterAssignee && !t.assignees?.some(a => a.id === filterAssignee)) return false
    if (filterClient && t.client_id !== filterClient) return false
    return true
  })

  const overdueCount = sorted.filter(t => t.due_date && t.due_date < today && !['Approved','Rejected'].includes(t.status)).length

  const clientGoals = clients.find(c => c.id === form.client_id)?.goals ?? [] as { id: string; name: string; vertical: string }[]

  function openAdd() { setEditing(null); setForm(emptyForm); setShowForm(true) }
  function openEdit(t: Task) {
    setEditing(t)
    setForm({
      title: t.title, due_date: t.due_date ?? '', priority: t.priority,
      status: t.status, client_id: t.client_id ?? '', goal_id: t.goal_id ?? '',
      assignee_ids: t.assignees?.map(a => a.id) ?? [],
    })
    setShowForm(true)
  }

  async function openDetail(t: Task) {
    setSelectedTask(t)
    setLoadingFU(true)
    const { data } = await supabase.from('follow_ups').select('*').eq('task_id', t.id).order('created_at')
    setFollowUps(data ?? [])
    setLoadingFU(false)
  }

  async function save() {
    setSaving(true)
    const payload = {
      title: form.title, due_date: form.due_date || null, priority: form.priority,
      status: form.status, client_id: form.client_id || null, goal_id: form.goal_id || null,
    }
    if (editing) {
      const { data } = await supabase.from('tasks').update(payload).eq('id', editing.id)
        .select('*, client:clients(id,name), goal:goals(id,name)').single()
      if (data) {
        // Update assignees
        await supabase.from('task_assignees').delete().eq('task_id', editing.id)
        if (form.assignee_ids.length > 0) {
          await supabase.from('task_assignees').insert(form.assignee_ids.map(id => ({ task_id: editing.id, team_member_id: id })))
        }
        const assignees = teamMembers.filter(m => form.assignee_ids.includes(m.id))
        setTasks(prev => prev.map(t => t.id === editing.id ? { ...data, assignees } : t))
      }
    } else {
      const { data } = await supabase.from('tasks').insert(payload)
        .select('*, client:clients(id,name), goal:goals(id,name)').single()
      if (data) {
        if (form.assignee_ids.length > 0) {
          await supabase.from('task_assignees').insert(form.assignee_ids.map(id => ({ task_id: data.id, team_member_id: id })))
        }
        const assignees = teamMembers.filter(m => form.assignee_ids.includes(m.id))
        setTasks(prev => [...prev, { ...data, assignees }])
      }
    }
    setSaving(false); setShowForm(false)
  }

  async function del(t: Task) {
    await supabase.from('tasks').delete().eq('id', t.id)
    setTasks(p => p.filter(x => x.id !== t.id))
    setSelectedTask(null)
  }

  async function updateStatus(t: Task, status: TaskStatus) {
    if (status === 'Rejected') { setRejectionModal(t); return }
    const { data } = await supabase.from('tasks').update({ status }).eq('id', t.id)
      .select('*, client:clients(id,name), goal:goals(id,name)').single()
    if (data) {
      const assignees = tasks.find(x => x.id === t.id)?.assignees ?? []
      const updated = { ...data, assignees }
      setTasks(p => p.map(x => x.id === t.id ? updated : x))
      if (selectedTask?.id === t.id) setSelectedTask(updated)
    }
  }

  async function confirmRejection() {
    if (!rejectionModal || !rejectionReason.trim()) return
    const { data } = await supabase.from('tasks').update({ status: 'Rejected' }).eq('id', rejectionModal.id)
      .select('*, client:clients(id,name), goal:goals(id,name)').single()
    if (data) {
      const assignees = tasks.find(x => x.id === rejectionModal.id)?.assignees ?? []
      const updated = { ...data, assignees }
      setTasks(p => p.map(x => x.id === rejectionModal.id ? updated : x))
      if (selectedTask?.id === rejectionModal.id) setSelectedTask(updated)
      // Add rejection follow-up
      const { data: fu } = await supabase.from('follow_ups').insert({
        task_id: rejectionModal.id,
        author_name: 'Admin',
        content: rejectionReason.trim(),
        is_rejection: true,
      }).select().single()
      if (fu && selectedTask?.id === rejectionModal.id) {
        setFollowUps(prev => [...prev, fu])
      }
    }
    setRejectionModal(null); setRejectionReason('')
  }

  function toggleAssignee(id: string) {
    setForm(p => ({
      ...p,
      assignee_ids: p.assignee_ids.includes(id)
        ? p.assignee_ids.filter(x => x !== id)
        : [...p.assignee_ids, id],
    }))
  }

  const rowBg = (t: Task) => {
    if (t.status === 'Approved') return 'bg-emerald-50/50'
    if (t.status === 'Rejected') return 'bg-red-50/50'
    if (t.due_date && t.due_date < today) return 'bg-red-50/30'
    if (t.due_date === today) return 'bg-amber-50/30'
    return ''
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium">StrideWorks</p>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          {overdueCount > 0 && <p className="text-xs text-red-500 font-semibold mt-0.5">{overdueCount} overdue</p>}
        </div>
        <Button size="sm" onClick={openAdd}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Task
        </Button>
      </div>

      {/* My Tasks / All Tasks toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
        <button onClick={() => setView('all')}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          All Tasks <span className="text-muted-foreground font-normal">({tasks.length})</span>
        </button>
        <button onClick={() => setView('mine')}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          My Tasks {currentMember && <span className="text-muted-foreground font-normal">({tasks.filter(t => t.assignees?.some(a => a.id === currentMember.id)).length})</span>}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
        {(['All', ...STATUSES] as const).map(s => (
          <Button key={s} size="sm" variant={filterStatus === s ? 'default' : 'outline'}
            className="shrink-0 text-xs h-7 px-2.5" onClick={() => setFilterStatus(s)}>
            {s}
          </Button>
        ))}
      </div>

      {/* Task list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No tasks</p>
          )}
          {filtered.map((t, i) => {
            const isOverdue = t.due_date && t.due_date < today && !['Approved','Rejected'].includes(t.status)
            const isToday = t.due_date === today && !['Approved','Rejected'].includes(t.status)
            return (
              <div key={t.id}>
                {i > 0 && <Separator />}
                <div onClick={() => openDetail(t)} className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors ${rowBg(t)}`}>
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${PRIORITY_DOT[t.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${t.status === 'Approved' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <AssigneeChips assignees={t.assignees ?? []} />
                      {t.client && <span className="text-xs text-muted-foreground">· {(t.client as any).name}{t.goal ? ` / ${(t.goal as any).name}` : ''}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge label={t.status} />
                    {t.due_date && (
                      <span className={`text-[11px] font-medium ${isOverdue ? 'text-red-500' : isToday ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {isToday ? 'Today' : fmt(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editing ? 'Edit Task' : 'New Task'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <div className="flex gap-1">
                  {PRIORITIES.map(p => (
                    <Button key={p} type="button" size="sm" variant={form.priority === p ? 'default' : 'outline'}
                      className="flex-1 text-xs h-11 px-1" onClick={() => setForm(x => ({ ...x, priority: p }))}>
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <Button key={s} type="button" size="sm" variant={form.status === s ? 'default' : 'outline'}
                    className={`text-xs h-7 ${ADMIN_ONLY.includes(s) ? 'border-dashed' : ''}`}
                    onClick={() => setForm(x => ({ ...x, status: s }))}>
                    {s}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Dashed = admin only</p>
            </div>
            {/* Assignees */}
            {teamMembers.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assignees</Label>
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map(m => (
                    <button key={m.id} onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${form.assignee_ids.includes(m.id) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      <span className="w-4 h-4 rounded-full bg-gray-400 text-white text-[8px] flex items-center justify-center font-bold shrink-0" style={{ background: form.assignee_ids.includes(m.id) ? 'rgba(255,255,255,0.3)' : undefined }}>
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                      {m.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Client (optional)</Label>
              <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v as string, goal_id: '' }))}>
                <SelectTrigger className="h-11"><SelectValue placeholder="No client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.client_id && clientGoals.length > 0 && (
              <div className="space-y-1.5">
                <Label>Goal (optional)</Label>
                <Select value={form.goal_id} onValueChange={v => setForm(p => ({ ...p, goal_id: v as string }))}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="No goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No goal</SelectItem>
                    {clientGoals.map(g => <SelectItem key={g.id} value={g.id}>{g.name} ({g.vertical})</SelectItem>)}
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal title={selectedTask.title} onClose={() => setSelectedTask(null)}>
          <div className="space-y-4">
            {/* Meta */}
            <div className="flex flex-wrap gap-2">
              <Badge label={selectedTask.status} />
              <Badge label={selectedTask.priority} />
              {selectedTask.due_date && (
                <span className={`text-xs font-medium ${selectedTask.due_date < today ? 'text-red-500' : selectedTask.due_date === today ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  Due {selectedTask.due_date === today ? 'today' : fmt(selectedTask.due_date)}
                </span>
              )}
            </div>

            {/* Assignees */}
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Assignees</p>
              <AssigneeChips assignees={selectedTask.assignees ?? []} />
            </div>

            {/* Client / Goal */}
            {((selectedTask.client as any)?.name || (selectedTask.goal as any)?.name) && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Linked to</p>
                <p className="text-sm font-medium">
                  {(selectedTask.client as any)?.name}
                  {(selectedTask.goal as any)?.name && <span className="text-muted-foreground"> / {(selectedTask.goal as any).name}</span>}
                </p>
              </div>
            )}

            <Separator />

            {/* Status actions */}
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Move to</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.filter(s => s !== selectedTask.status).map(s => (
                  <Button key={s} size="sm" variant="outline"
                    className={`text-xs h-7 ${s === 'Approved' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : s === 'Rejected' ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
                    onClick={() => updateStatus(selectedTask, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Follow-ups */}
            {loadingFU ? (
              <p className="text-xs text-muted-foreground text-center py-2">Loading…</p>
            ) : (
              <FollowUps taskId={selectedTask.id} followUps={followUps} authorName="Admin" />
            )}

            <Separator />

            {/* Edit / Delete */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTask(null); openEdit(selectedTask) }}>Edit task</Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30" onClick={() => del(selectedTask)}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection reason modal */}
      {rejectionModal && (
        <Modal title="Rejection reason" onClose={() => { setRejectionModal(null); setRejectionReason('') }}>
          <p className="text-sm text-muted-foreground mb-3">This will be saved as a follow-up on the task.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what needs to be fixed…" className={inp} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setRejectionModal(null); setRejectionReason('') }}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={!rejectionReason.trim()} onClick={confirmRejection}>
                Reject Task
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
