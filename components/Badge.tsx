import { Badge as ShadBadge } from '@/components/ui/badge'

const styleMap: Record<string, string> = {
  // Client status
  Active:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  'On Hold':     'bg-amber-100 text-amber-700 border-amber-200',
  Completed:     'bg-gray-100 text-gray-500 border-gray-200',
  Closed:        'bg-red-100 text-red-600 border-red-200',
  // Task status
  'To Do':       'bg-gray-100 text-gray-500 border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'In Review':   'bg-violet-100 text-violet-700 border-violet-200',
  Approved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected:      'bg-red-100 text-red-600 border-red-200',
  // Priority
  High:          'bg-red-100 text-red-600 border-red-200',
  Medium:        'bg-amber-100 text-amber-700 border-amber-200',
  Low:           'bg-blue-100 text-blue-600 border-blue-200',
  // Verticals
  Ads:           'bg-orange-100 text-orange-700 border-orange-200',
  Tech:          'bg-cyan-100 text-cyan-700 border-cyan-200',
  Creative:      'bg-pink-100 text-pink-700 border-pink-200',
  // Engagement
  Retainer:      'bg-violet-100 text-violet-700 border-violet-200',
  Project:       'bg-sky-100 text-sky-700 border-sky-200',
  Done:          'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export default function Badge({ label }: { label: string }) {
  const cls = styleMap[label] ?? 'bg-gray-100 text-gray-500 border-gray-200'
  return (
    <ShadBadge variant="outline" className={`text-[10px] font-semibold border ${cls}`}>
      {label}
    </ShadBadge>
  )
}
