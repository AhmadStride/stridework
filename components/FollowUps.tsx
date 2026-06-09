'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FollowUp } from '@/lib/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function FollowUps({ taskId, followUps: initial, authorName }: {
  taskId: string
  followUps: FollowUp[]
  authorName: string
}) {
  const supabase = createClient()
  const [followUps, setFollowUps] = useState(initial)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote() {
    if (!text.trim()) return
    setSaving(true)
    const { data } = await supabase.from('follow_ups').insert({
      task_id: taskId,
      author_name: authorName,
      content: text.trim(),
      is_rejection: false,
    }).select().single()
    if (data) setFollowUps(prev => [...prev, data])
    setText('')
    setSaving(false)
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Follow-ups {followUps.length > 0 && <span className="font-normal normal-case">({followUps.length})</span>}
      </p>

      {/* Thread */}
      {followUps.length > 0 && (
        <div className="space-y-3 mb-4">
          {followUps.map(f => (
            <div key={f.id} className={`rounded-xl px-3.5 py-3 text-sm ${f.is_rejection ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  {f.author_name.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs font-semibold ${f.is_rejection ? 'text-red-600' : 'text-gray-700'}`}>
                  {f.author_name} {f.is_rejection && '· Rejection reason'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(f.created_at)}</span>
              </div>
              <p className={`text-sm leading-relaxed ${f.is_rejection ? 'text-red-700' : 'text-gray-700'}`}>{f.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add note */}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addNote()}
          placeholder="Add a follow-up…"
          className="flex-1 h-9 text-sm placeholder:text-sm"
        />
        <Button size="sm" onClick={addNote} disabled={saving || !text.trim()} className="shrink-0 h-9">
          Send
        </Button>
      </div>
    </div>
  )
}
