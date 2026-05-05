import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'purple' | 'emerald' | 'amber' | 'sky'
}

const colors = {
  purple: 'bg-violet-500/15 text-violet-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-400',
  sky: 'bg-sky-500/15 text-sky-400',
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp, color = 'purple' }: StatCardProps) {
  return (
    <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium mb-2">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}
