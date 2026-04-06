import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Trash2, Mail, Phone, MapPin,
  Calendar, MessageSquare, Plus, Clock, Sparkles,
  ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react'
import { api } from '../api'
import StrengthBadge from '../components/StrengthBadge'
import { formatDate, daysUntil } from '../utils'
import {
  getOpportunityScore, getOpportunityLabel,
  getActivityInsight, getReachOutReason,
  getSuggestedMessage, detectIndustry,
} from '../lib/intelligence'

export default function ConnectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [conn, setConn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], note: '' })
  const [showMessage, setShowMessage] = useState(false)
  const [copied, setCopied] = useState(false)

  function load() {
    api.getConnection(id).then(data => { setConn(data); setLoading(false) })
  }
  useEffect(load, [id])

  async function handleDelete() {
    if (!window.confirm(`Delete ${conn.full_name}? This cannot be undone.`)) return
    await api.deleteConnection(id)
    navigate('/connections')
  }

  async function handleLogInteraction(e) {
    e.preventDefault()
    await api.addInteraction(id, logForm)
    setShowLog(false)
    setLogForm({ date: new Date().toISOString().split('T')[0], note: '' })
    load()
  }

  async function handleDeleteInteraction(intId) {
    if (!window.confirm('Remove this interaction?')) return
    await api.deleteInteraction(id, intId)
    load()
  }

  async function copyMessage(text) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
    </div>
  )
  if (!conn) return <p className="text-center text-stone-500 mt-20">Connection not found.</p>

  const days = daysUntil(conn.follow_up_date)
  const overdue = conn.follow_up_date && days < 0

  // Intelligence data — computed locally
  const score    = getOpportunityScore(conn)
  const label    = getOpportunityLabel(score)
  const reason   = getReachOutReason(conn)
  const activity = getActivityInsight(conn)
  const message  = getSuggestedMessage(conn)
  const industry = detectIndustry(conn)

  const SCORE_COLORS = {
    Hot:  { stroke: '#ef4444', bg: 'bg-red-50',   text: 'text-red-600' },
    Warm: { stroke: '#c9a010', bg: 'bg-gold-50', text: 'text-gold-600' },
    Cold: { stroke: '#60a5fa', bg: 'bg-blue-50',  text: 'text-blue-500' },
  }
  const sc = SCORE_COLORS[label]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={() => navigate('/connections')} className="p-2 hover:bg-stone-100 rounded-lg transition-colors mt-0.5">
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-800">{conn.full_name}</h1>
            <StrengthBadge strength={conn.strength} />
          </div>
          <p className="text-stone-500 text-sm mt-0.5">
            {[conn.position, conn.company].filter(Boolean).join(' @ ')}
            {industry !== 'General Business' && (
              <span className="ml-2 text-xs text-stone-400">· {industry}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/connections/${id}/edit`}
            className="flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium">
            <Edit2 className="h-4 w-4" /> Edit
          </Link>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* ── Follow-up overdue banner ─────────────────────────────── */}
      {overdue && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">
              Follow-up overdue by {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''}!
            </p>
            <p className="text-red-500 text-xs">Was planned for {formatDate(conn.follow_up_date)}</p>
          </div>
          <Link to={`/connections/${id}/edit`} className="ml-auto text-xs text-red-600 hover:underline font-medium">
            Reschedule →
          </Link>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column: main content ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Contact info */}
          <Card title="Contact Information">
            <div className="space-y-3">
              {conn.email && (
                <InfoRow icon={<Mail className="h-4 w-4" />}>
                  <a href={`mailto:${conn.email}`} className="text-gold-600 hover:underline">{conn.email}</a>
                </InfoRow>
              )}
              {conn.phone && (
                <InfoRow icon={<Phone className="h-4 w-4" />}>
                  <span>{conn.phone}</span>
                </InfoRow>
              )}
              {conn.where_met && (
                <InfoRow icon={<MapPin className="h-4 w-4" />}>
                  <span>Met via <strong className="text-stone-700">{conn.where_met}</strong></span>
                </InfoRow>
              )}
              {conn.date_met && (
                <InfoRow icon={<Calendar className="h-4 w-4" />}>
                  <span>First met on <strong className="text-stone-700">{formatDate(conn.date_met)}</strong></span>
                </InfoRow>
              )}
              {!conn.email && !conn.phone && !conn.where_met && !conn.date_met && (
                <p className="text-stone-400 text-sm">No contact info added yet.</p>
              )}
            </div>
          </Card>

          {/* Notes */}
          {conn.notes && (
            <Card title="Notes">
              <p className="text-stone-700 text-sm whitespace-pre-wrap leading-relaxed">{conn.notes}</p>
            </Card>
          )}

          {/* Insights panel */}
          <div className="bg-gradient-to-br from-gold-50 to-navy-50 border border-gold-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-gold-500" />
              <h2 className="text-xs font-semibold text-gold-700 uppercase tracking-widest">Smart Insights</h2>
            </div>

            <div className="space-y-3">
              {/* Why reach out */}
              <div className="bg-white rounded-lg px-3.5 py-3 border border-gold-100">
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-1">Why Reach Out Now</p>
                <p className="text-sm text-stone-700">{reason}</p>
              </div>

              {/* Industry activity */}
              <div className="bg-white rounded-lg px-3.5 py-3 border border-stone-100">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Industry Activity</p>
                <p className="text-sm text-stone-600">{activity}</p>
              </div>

              {/* Suggested message (expandable) */}
              <div>
                <button
                  onClick={() => setShowMessage(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  {showMessage ? 'Hide' : 'Show'} Suggested Outreach
                  {showMessage ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showMessage && (
                  <div className="mt-2 bg-white border border-stone-200 rounded-lg overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Template Message</p>
                      <button
                        onClick={() => copyMessage(message)}
                        className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium"
                      >
                        {copied
                          ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</>
                          : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                      </button>
                    </div>
                    <p className="px-4 py-3 text-sm text-stone-700 whitespace-pre-line leading-relaxed">{message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interaction timeline */}
          <Card
            title="Interaction History"
            action={
              <button onClick={() => setShowLog(v => !v)}
                className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700">
                <Plus className="h-3.5 w-3.5" /> Log Interaction
              </button>
            }
          >
            {showLog && (
              <form onSubmit={handleLogInteraction} className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Date</label>
                  <input type="date" required
                    value={logForm.date}
                    onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))}
                    className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 w-full sm:w-auto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">What happened?</label>
                  <textarea required rows={2}
                    value={logForm.note}
                    onChange={e => setLogForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="Sent a follow-up email, had a coffee chat, connected on LinkedIn…"
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-1.5 bg-gold-500 hover:bg-gold-400 text-stone-900 font-semibold rounded-lg text-sm transition-colors">Save</button>
                  <button type="button" onClick={() => setShowLog(false)} className="px-4 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg text-sm transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {conn.interactions?.length > 0 ? (
              <ol className="space-y-0">
                {conn.interactions.map((int, i) => (
                  <li key={int.id} className="flex gap-3 group">
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-gold-100" />
                      {i < conn.interactions.length - 1 && (
                        <div className="flex-1 w-px bg-stone-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-0.5">
                            {formatDate(int.date)}
                          </p>
                          <p className="text-sm text-stone-700">{int.note}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteInteraction(int.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <MessageSquare className="h-9 w-9 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No interactions logged yet.</p>
                <button onClick={() => setShowLog(true)} className="text-gold-600 text-sm hover:underline mt-1">
                  Log your first one →
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">

          {/* Avatar card with score */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 text-center">
            <div className="h-16 w-16 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-2xl mx-auto mb-3">
              {conn.full_name.charAt(0).toUpperCase()}
            </div>
            <p className="font-semibold text-stone-800">{conn.full_name}</p>
            {conn.position && <p className="text-xs text-stone-500 mt-0.5">{conn.position}</p>}
            {conn.company  && <p className="text-xs text-gold-600 font-medium mt-0.5">{conn.company}</p>}

            {/* Score ring inline */}
            <div className={`mt-4 inline-flex flex-col items-center gap-1 ${sc.bg} rounded-xl px-4 py-2`}>
              <svg width="52" height="52" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#e7e5e4" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke={sc.stroke} strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - score / 100)}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px' }}
                />
                <text x="24" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill={sc.stroke}>
                  {score}
                </text>
              </svg>
              <span className={`text-xs font-bold uppercase tracking-wide ${sc.text}`}>{label} Opportunity</span>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Key Dates</h3>
            <div className="space-y-2">
              <DateRow label="Last Contact" value={conn.last_contact} />
              <DateRow label="Follow-Up" value={conn.follow_up_date}
                highlight={overdue ? 'red' : (days !== null && days <= 7) ? 'amber' : null} />
              <DateRow label="First Met" value={conn.date_met} />
            </div>
          </div>

          {/* Tags */}
          {conn.tags?.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {conn.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-navy-100 text-gold-700 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {conn.email && (
                <a href={`mailto:${conn.email}`}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-gold-50 hover:text-gold-700 rounded-lg transition-colors">
                  <Mail className="h-4 w-4" /> Send Email
                </a>
              )}
              <button onClick={() => setShowLog(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-gold-50 hover:text-gold-700 rounded-lg transition-colors">
                <Clock className="h-4 w-4" /> Log Interaction
              </button>
              <Link to={`/connections/${id}/edit`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-gold-50 hover:text-gold-700 rounded-lg transition-colors">
                <Edit2 className="h-4 w-4" /> Edit Contact
              </Link>
              <Link to="/opportunities"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-gold-50 hover:text-gold-700 rounded-lg transition-colors">
                <Sparkles className="h-4 w-4" /> View All Opportunities
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Card({ title, action, children }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ icon, children }) {
  return (
    <div className="flex items-start gap-3 text-sm text-stone-500">
      <span className="mt-0.5 shrink-0">{icon}</span>
      {children}
    </div>
  )
}

function DateRow({ label, value, highlight }) {
  const color = highlight === 'red' ? 'text-red-600 font-semibold'
    : highlight === 'amber' ? 'text-gold-600 font-medium'
    : 'text-stone-700'
  return (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className={`text-sm ${color}`}>{value ? formatDate(value) : '—'}</p>
    </div>
  )
}
