import { TrendingUp, Database, Zap, Users } from 'lucide-react'

export default function StatCard({ title, value, delta }) {
  const getIcon = () => {
    if (title.includes('Data')) return Database
    if (title.includes('Application')) return Users
    if (title.includes('Interaction')) return Zap
    return TrendingUp
  }

  const Icon = getIcon()
  const isPositive = delta?.includes('+')

  return (
    <div className="bg-card-dark rounded-xl p-6 min-h-[140px] flex flex-col justify-between shadow-lg border border-white/5 hover:border-emerald-400/20 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-sidebar-muted">{title}</div>
        <div className="p-2 bg-card-darker rounded-lg group-hover:bg-emerald-900/20 transition-colors">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-white">{value}</div>
        {delta && (
          <div className={`text-sm mt-2 flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-gray-400'}`}>
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}

