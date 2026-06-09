import { Badge as ShadBadge } from '@/components/ui/badge'

const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Active: 'default',
  Done: 'default',
  High: 'destructive',
  'On Hold': 'outline',
  Completed: 'secondary',
  Medium: 'outline',
  Low: 'secondary',
  Retainer: 'secondary',
  Project: 'outline',
  Creative: 'secondary',
  Ads: 'outline',
  Tech: 'secondary',
  'To Do': 'secondary',
  'In Progress': 'outline',
}

const extraCls: Record<string, string> = {
  Active: 'bg-emerald-600 hover:bg-emerald-600',
  Done: 'bg-emerald-600 hover:bg-emerald-600',
  'In Progress': 'border-blue-300 text-blue-700',
  Retainer: 'text-violet-700 border-violet-300',
  Creative: 'text-pink-700 border-pink-300',
  Ads: 'text-orange-700 border-orange-300',
  Tech: 'text-cyan-700 border-cyan-300',
}

export default function Badge({ label }: { label: string }) {
  const variant = variantMap[label] ?? 'secondary'
  const extra = extraCls[label] ?? ''
  return (
    <ShadBadge variant={variant} className={`text-[10px] font-semibold ${extra}`}>
      {label}
    </ShadBadge>
  )
}
