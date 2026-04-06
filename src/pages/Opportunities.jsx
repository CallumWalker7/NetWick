/**
 * Opportunities.jsx — "Smart" outreach prioritization page.
 *
 * Ranks all contacts by opportunity score (0–100) computed entirely
 * locally in intelligence.js. No API keys, no internet required.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Flame, ThermometerSun, Snowflake,
  MessageSquare, ChevronDown, ChevronUp,
  Building2, Clock, Copy, Check,
} from 'lucide-react'
import { api } from '../api'
import {
  getOpportunityScore, getOpportunityLabel,
  getActivityInsight, getReachOutReason,
  getSuggestedMessage, detectIndustry,
} from '../lib/intelligence'
import StrengthBadge from '../components/StrengthBadge'
import { formatDate, daysUntil, today } from '../utils'

export default function Opportunities() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')      // 'all' | 'hot' | 'warm' | 'cold'
  const [expanded, setExpanded] = useState({})     // { [id]: boolean }
  const [copied, setCopied] = useState(null)       // id of last copied message

  useEffect(() => {
    api.getConnections().then(data => {
      setConnections(data)
      setLoading(false)
    })
  }, [])

  // Attach score + label to every connection, then filter + sort
  const scored = connections
    .map(c => {
      const score = getOpportunityScore(c)
      return { ...c, _score: score, _label: getOpportunityLabel(score) }
    })
    .filter(c => filter === 'all' || c._label.toLowerCase() === filter)
    .sort((a, b) => b._score - a._score)

  const counts = {
    hot:  connections.filter(c => getOpportunityLabel(getOpportunityScore(c)) === 'Hot').length,
    warm: connections.filter(c => getOpportunityLabel(getOpportunityScore(c)) === 'Warm').length,
    cold: connections.filter(c => getOpportunityLabel(getOpportunityScore(c)) === 'Cold').length,
  }

  function toggleMessage(id) {
    setExpanded(p => ({ ...p, [id]: !p[id] }))
  }

  async function copyMessage(id, text) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Opportunities</h1>
          <p className="text-stone-500 mt-1">
            Your smartest next outreach moves, ranked by priority score
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          All insights are generated locally — no internet required
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',  label: 'All Contacts', count: connections.length },
          { key: 'hot',  label: 'Hot',  count: counts.hot },
          { key: 'warm', label: 'Warm', count: counts.warm },
          { key: 'cold', label: 'Cold', count: counts.cold },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {tab.key === 'hot'  && <Flame          className="h-3.5 w-3.5 text-red-400" />}
            {tab.key === 'warm' && <ThermometerSun className="h-3.5 w-3.5 text-gold-400" />}
            {tab.key === 'cold' && <Snowflake      className="h-3.5 w-3.5 text-blue-400" />}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Contact cards ────────────────────────────────────────── */}
      {scored.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-stone-400">
          <Sparkles className="h-12 w-12 mb-3 opacity-25" />
          <p className="font-medium text-stone-500">No connections found</p>
          <p className="text-sm mt-1">
            {connections.length === 0
              ? 'Add your first contact to see opportunities.'
              : 'Try a different filter above.'}
          </p>
          {connections.length === 0 && (
            <Link to="/connections/new" className="text-gold-600 hover:underline text-sm mt-3">
              Add contact →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {scored.map((conn, idx) => {
            const { _score: score, _label: label } = conn
            const reason   = getReachOutReason(conn)
            const activity = getActivityInsight(conn)
            const message  = getSuggestedMessage(conn)
            const industry = detectIndustry(conn)
            const isOpen   = expanded[conn.id]

            const todayStr = today()
            const overdue  = conn.follow_up_date && conn.follow_up_date < todayStr
            const fuDays   = daysUntil(conn.follow_up_date)
            const fuSoon   = conn.follow_up_date && fuDays >= 0 && fuDays <= 7

            const neverContacted = !conn.last_contact
            const longSilence    = conn.last_contact && (() => {
              const [y, m, d] = conn.last_contact.split('-').map(Number)
              return Math.floor((new Date() - new Date(y, m - 1, d)) / 86_400_000) > 60
            })()

            const isTop = idx === 0

            return (
              <div
                key={conn.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md border ${
                  isTop ? 'border-gold-300' : 'border-stone-200'
                }`}
              >
                {/* Top priority ribbon */}
                {isTop && (
                  <div className="bg-gold-50 border-b border-gold-200 px-5 py-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                    <span className="text-xs font-semibold text-gold-700">Top Priority — Reach Out First</span>
                  </div>
                )}

                <div className="p-5">
                  {/* ── Card header row ── */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-11 w-11 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-xl shrink-0 select-none">
                      {conn.full_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/connections/${conn.id}`}
                          className="font-semibold text-stone-800 hover:text-gold-700 text-lg leading-tight"
                        >
                          {conn.full_name}
                        </Link>
                        <StrengthBadge strength={conn.strength} />
                      </div>

                      <p className="text-sm text-stone-500 mt-0.5">
                        {[conn.position, conn.company].filter(Boolean).join(' @ ')}
                        {industry !== 'General Business' && (
                          <span className="ml-2 text-xs text-stone-400">· {industry}</span>
                        )}
                      </p>

                      {/* Status badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {overdue && (
                          <Badge color="red">Follow-up overdue</Badge>
                        )}
                        {fuSoon && !overdue && (
                          <Badge color="amber">Follow-up in {fuDays}d</Badge>
                        )}
                        {longSilence && (
                          <Badge color="stone">Long time no contact</Badge>
                        )}
                        {neverContacted && (
                          <Badge color="blue">Never reached out</Badge>
                        )}
                        {conn.strength === 'strong' && (
                          <Badge color="green">Strong connection</Badge>
                        )}
                      </div>
                    </div>

                    {/* Score ring */}
                    <div className="shrink-0">
                      <ScoreRing score={score} label={label} />
                    </div>
                  </div>

                  {/* ── Insight boxes ── */}
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <div className="bg-gold-50 border border-gold-100 rounded-lg px-3.5 py-3">
                      <p className="text-xs font-semibold text-gold-700 uppercase tracking-widest mb-1.5">
                        Why Reach Out Now
                      </p>
                      <p className="text-sm text-stone-700 leading-snug">{reason}</p>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 rounded-lg px-3.5 py-3">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Industry Insight
                      </p>
                      <p className="text-sm text-stone-600 leading-snug">{activity}</p>
                    </div>
                  </div>

                  {/* ── Suggested message (expandable) ── */}
                  <div className="mt-3.5">
                    <button
                      onClick={() => toggleMessage(conn.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isOpen ? 'Hide' : 'Show'} Suggested Message
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isOpen && (
                      <div className="mt-3 bg-white border border-stone-200 rounded-lg overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b border-stone-100">
                          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            Suggested Outreach Message
                          </p>
                          <button
                            onClick={() => copyMessage(conn.id, message)}
                            className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
                          >
                            {copied === conn.id
                              ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</>
                              : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                          </button>
                        </div>
                        <p className="px-4 py-3 text-sm text-stone-700 whitespace-pre-line leading-relaxed">
                          {message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Circular SVG score ring with numeric score + label.
 * Progress arc is determined by score / 100.
 */
function ScoreRing({ score, label }) {
  const COLORS = {
    Hot:  { stroke: '#ef4444', bg: 'bg-red-50',    text: 'text-red-600' },
    Warm: { stroke: '#c9a010', bg: 'bg-gold-50',  text: 'text-gold-600' },
    Cold: { stroke: '#60a5fa', bg: 'bg-blue-50',   text: 'text-blue-500' },
  }
  const { stroke, bg, text } = COLORS[label]
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className={`flex flex-col items-center gap-1 ${bg} rounded-xl px-3 py-2 min-w-[66px]`}>
      <svg width="52" height="52" viewBox="0 0 48 48">
        {/* Track */}
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e7e5e4" strokeWidth="4" />
        {/* Progress arc */}
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={stroke} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px', transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Score number */}
        <text x="24" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill={stroke}>
          {score}
        </text>
      </svg>
      <span className={`text-xs font-bold uppercase tracking-wide ${text}`}>{label}</span>
    </div>
  )
}

function Badge({ color, children }) {
  const STYLES = {
    red:   'bg-red-100 text-red-600',
    amber: 'bg-gold-100 text-gold-700',
    green: 'bg-green-100 text-green-700',
    stone: 'bg-stone-100 text-stone-500',
    blue:  'bg-blue-100 text-blue-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STYLES[color]}`}>
      {children}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
    </div>
  )
}
