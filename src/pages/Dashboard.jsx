import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, Bell, CalendarDays, ArrowRight, Network, Sparkles, Flame, ThermometerSun } from 'lucide-react'
import { api } from '../api'
import StatsCard from '../components/StatsCard'
import StrengthBadge from '../components/StrengthBadge'
import { formatDate, daysUntil } from '../utils'
import { getOpportunityScore, getOpportunityLabel, getReachOutReason } from '../lib/intelligence'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getStats(), api.getConnections()])
      .then(([s, c]) => { setStats(s); setConnections(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const followUps = [...connections]
    .filter(c => c.follow_up_date)
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))
    .slice(0, 6)

  const recent = [...connections]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)

  // Top 3 opportunities by score
  const topOpportunities = [...connections]
    .map(c => ({ ...c, _score: getOpportunityScore(c), _label: getOpportunityLabel(getOpportunityScore(c)) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)

  const byStrength = { strong: 0, medium: 0, weak: 0 }
  stats?.byStrength?.forEach(r => { byStrength[r.strength] = r.count })

  const strengthBars = [
    { label: 'Strong', key: 'strong', bar: 'bg-green-500' },
    { label: 'Medium', key: 'medium', bar: 'bg-gold-400' },
    { label: 'Weak',   key: 'weak',   bar: 'bg-stone-300' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">Your networking at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Connections"
          value={stats?.total ?? 0}
          icon={<Users className="h-5 w-5" />}
          colorClass="bg-gold-100 text-gold-600"
        />
        <StatsCard
          title="Strong Connections"
          value={byStrength.strong}
          icon={<TrendingUp className="h-5 w-5" />}
          colorClass="bg-navy-100 text-navy-600"
        />
        <StatsCard
          title="Follow-Ups Due (7d)"
          value={stats?.followUpSoon ?? 0}
          icon={<Bell className="h-5 w-5" />}
          colorClass="bg-gold-200 text-navy-700"
        />
        <StatsCard
          title="Added This Month"
          value={stats?.newThisMonth ?? 0}
          icon={<CalendarDays className="h-5 w-5" />}
          colorClass="bg-navy-200 text-navy-700"
        />
      </div>

      {/* Top Opportunities strip */}
      {topOpportunities.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-500" />
              <h2 className="text-base font-semibold text-stone-700">Top Outreach Opportunities</h2>
            </div>
            <Link
              to="/opportunities"
              className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {topOpportunities.map((conn, idx) => {
              const reason = getReachOutReason(conn)
              const LabelIcon = conn._label === 'Hot' ? Flame : ThermometerSun
              const iconColor = conn._label === 'Hot' ? 'text-red-500' : 'text-gold-500'
              return (
                <Link
                  key={conn.id}
                  to={`/connections/${conn.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-50 transition-colors group"
                >
                  {/* Rank */}
                  <span className="text-xs font-bold text-stone-300 w-4 shrink-0">#{idx + 1}</span>
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-sm shrink-0">
                    {conn.full_name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 group-hover:text-navy-700 truncate">
                      {conn.full_name}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{reason}</p>
                  </div>
                  {/* Score label */}
                  <div className="flex items-center gap-1 shrink-0">
                    <LabelIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                    <span className={`text-xs font-bold ${iconColor}`}>{conn._score}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Strength breakdown */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-stone-700 mb-5">Connection Strength Breakdown</h2>
        {(stats?.total ?? 0) > 0 ? (
          <div className="space-y-4">
            {strengthBars.map(({ label, key, bar }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-16 text-sm text-stone-500 shrink-0">{label}</span>
                <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`${bar} h-3 rounded-full transition-all duration-700`}
                    style={{ width: `${stats.total ? (byStrength[key] / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-sm font-semibold text-stone-600 text-right">{byStrength[key]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 text-sm">Add your first connection to see stats here.</p>
        )}
      </div>

      {/* Follow-ups + Recently added */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Upcoming follow-ups */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-stone-700">Upcoming Follow-Ups</h2>
            <Bell className="h-4 w-4 text-gold-500" />
          </div>
          {followUps.length > 0 ? (
            <div className="space-y-1">
              {followUps.map(conn => {
                const days = daysUntil(conn.follow_up_date)
                const overdue = days < 0
                const urgent  = days >= 0 && days <= 2
                return (
                  <Link
                    key={conn.id}
                    to={`/connections/${conn.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 group-hover:text-navy-700 truncate">
                        {conn.full_name}
                      </p>
                      <p className="text-xs text-stone-400 truncate">{conn.company}</p>
                    </div>
                    <span className={`ml-3 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      overdue ? 'bg-red-100 text-red-600'
                      : urgent ? 'bg-orange-100 text-orange-600'
                      : 'bg-gold-50 text-gold-700'
                    }`}>
                      {overdue
                        ? `${Math.abs(days)}d overdue`
                        : days === 0 ? 'Today'
                        : days === 1 ? 'Tomorrow'
                        : `${days}d`}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-6">
              No upcoming follow-ups — you're all caught up!
            </p>
          )}
        </div>

        {/* Recently added */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-stone-700">Recently Added</h2>
            <Link
              to="/connections"
              className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="space-y-1">
              {recent.map(conn => (
                <Link
                  key={conn.id}
                  to={`/connections/${conn.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors group"
                >
                  <Avatar name={conn.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 group-hover:text-navy-700 truncate">
                      {conn.full_name}
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                      {[conn.position, conn.company].filter(Boolean).join(' @ ')}
                    </p>
                  </div>
                  <StrengthBadge strength={conn.strength} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Network className="h-10 w-10 text-stone-200 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">No connections yet.</p>
              <Link to="/connections/new" className="text-gold-600 text-sm hover:underline mt-1 inline-block">
                Add your first one →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Avatar({ name }) {
  return (
    <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-sm shrink-0">
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
    </div>
  )
}
