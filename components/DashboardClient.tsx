'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Badge from '@/components/Badge'
import { Task } from '@/lib/types'

interface Stats {
  activeClients: number; totalClients: number
  overdueCount: number; dueTodayCount: number; activeEngagements: number
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardClient({ stats, recentTasks, today }: { stats: Stats; recentTasks: Task[]; today: string }) {
  const overdue = recentTasks.filter(t => t.due_date && t.due_date < today)
  const dueToday = recentTasks.filter(t => t.due_date === today)
  const upcoming = recentTasks.filter(t => !t.due_date || t.due_date > today)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-medium">{greeting()}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Active Clients" value={stats.activeClients} sub={`of ${stats.totalClients} total`} />
        <StatCard label="Engagements" value={stats.activeEngagements} sub="active" />
        <StatCard label="Overdue" value={stats.overdueCount} sub="tasks" alert={stats.overdueCount > 0} />
        <StatCard label="Due Today" value={stats.dueTodayCount} sub="tasks" warn={stats.dueTodayCount > 0} />
      </div>

      {overdue.length > 0 && <TaskSection label="Overdue" labelCls="text-destructive" tasks={overdue} today={today} />}
      {dueToday.length > 0 && <TaskSection label="Due Today" labelCls="text-amber-600" tasks={dueToday} today={today} />}
      <TaskSection label="Upcoming" labelCls="text-foreground" tasks={upcoming.slice(0, 6)} today={today} showAll />
    </div>
  )
}

function StatCard({ label, value, sub, alert, warn }: { label: string; value: number; sub?: string; alert?: boolean; warn?: boolean }) {
  return (
    <Card className={alert ? 'border-destructive/30 bg-destructive/5' : warn ? 'border-amber-300/50 bg-amber-50/50' : ''}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className={`text-3xl font-bold tracking-tight mt-1 ${alert ? 'text-destructive' : warn ? 'text-amber-600' : ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function TaskSection({ label, labelCls, tasks, today, showAll }: { label: string; labelCls: string; tasks: Task[]; today: string; showAll?: boolean }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-bold uppercase tracking-wide ${labelCls}`}>{label}</p>
        {showAll && <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">See all</Link>}
      </div>
      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No tasks here</p>
          )}
          {tasks.map((t, i) => {
            const isOverdue = t.due_date && t.due_date < today && t.status !== 'Done'
            const isToday = t.due_date === today
            return (
              <div key={t.id}>
                {i > 0 && <Separator />}
                <Link href="/tasks" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors rounded-[inherit]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    {(t.client as any)?.name && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {(t.client as any).name}{(t.engagement as any)?.name ? ` · ${(t.engagement as any).name}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge label={t.priority} />
                    {t.due_date && (
                      <span className={`text-[11px] font-medium ${isOverdue ? 'text-destructive' : isToday ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {isToday ? 'Today' : fmt(t.due_date)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
