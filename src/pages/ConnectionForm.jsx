import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { api } from '../api'

const SUGGESTED_TAGS = [
  'Finance', 'Tech', 'Pre-Med', 'Law', 'Research',
  'Alumni', 'Family Friend', 'Internship', 'Conference',
  'Club/Activity', 'College', 'Job Fair',
]

const WHERE_MET = [
  'School/Class', 'Internship', 'Networking Event', 'Cold Email',
  'LinkedIn', 'Conference', 'Club/Activity', 'Family/Friend Intro',
  'Job Fair', 'Social Media', 'Other',
]

const INDUSTRIES = [
  'Finance', 'Technology', 'Consulting', 'Law', 'Healthcare',
  'Marketing & Media', 'Real Estate', 'Non-Profit',
  'Education', 'Government', 'General Business',
]

const EMPTY_FORM = {
  full_name: '', company: '', position: '', industry: '',
  where_met: '', date_met: '', email: '', phone: '', notes: '',
  strength: 'medium', last_contact: '', follow_up_date: '', tags: [],
}

export default function ConnectionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) return
    api.getConnection(id).then(data => {
      setForm({ ...EMPTY_FORM, ...data, tags: data.tags ?? [] })
      setLoading(false)
    })
  }, [id, isEditing])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addTag(raw) {
    const tag = raw.trim()
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag])
    setTagInput('')
  }

  function removeTag(tag) {
    set('tags', form.tags.filter(t => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEditing) {
        await api.updateConnection(id, form)
        navigate(`/connections/${id}`)
      } else {
        const created = await api.createConnection(form)
        navigate(`/connections/${created.id}`)
      }
    } catch {
      setError('Something went wrong. Is the backend server running?')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            {isEditing ? 'Edit Connection' : 'Add New Connection'}
          </h1>
          <p className="text-stone-500 text-sm">
            {isEditing ? 'Update this contact\'s information' : 'Add someone new to your network'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 shadow-sm divide-y divide-stone-100">

        {/* ── Basic Info ──────────────────────────────────────── */}
        <Section title="Basic Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Full Name *</Label>
              <Input
                value={form.full_name} required
                placeholder="e.g. Sarah Johnson"
                onChange={e => set('full_name', e.target.value)}
              />
            </div>
            <div>
              <Label>Company / Organization</Label>
              <Input
                value={form.company}
                placeholder="e.g. Goldman Sachs"
                onChange={e => set('company', e.target.value)}
              />
            </div>
            <div>
              <Label>Position / Role</Label>
              <Input
                value={form.position}
                placeholder="e.g. Investment Analyst"
                onChange={e => set('position', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>
                Industry
                <span className="ml-1 text-xs text-stone-400 font-normal">(used for smart insights)</span>
              </Label>
              <select
                value={form.industry}
                onChange={e => set('industry', e.target.value)}
                className={selectCls}
              >
                <option value="">Auto-detect from company / tags</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Contact Info ─────────────────────────────────────── */}
        <Section title="Contact Info">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email" value={form.email}
                placeholder="sarah@example.com"
                onChange={e => set('email', e.target.value)}
              />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                value={form.phone}
                placeholder="+1 (555) 000-0000"
                onChange={e => set('phone', e.target.value)}
              />
            </div>
          </div>
        </Section>

        {/* ── Meeting Details ──────────────────────────────────── */}
        <Section title="Meeting Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Where You Met</Label>
              <select value={form.where_met} onChange={e => set('where_met', e.target.value)} className={selectCls}>
                <option value="">Select…</option>
                {WHERE_MET.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label>Date Met</Label>
              <Input type="date" value={form.date_met} onChange={e => set('date_met', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── Relationship ─────────────────────────────────────── */}
        <Section title="Relationship">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Connection Strength</Label>
              <select value={form.strength} onChange={e => set('strength', e.target.value)} className={selectCls}>
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div>
              <Label>Last Contact</Label>
              <Input type="date" value={form.last_contact} onChange={e => set('last_contact', e.target.value)} />
            </div>
            <div>
              <Label>Follow-Up Date</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── Tags ─────────────────────────────────────────────── */}
        <Section title="Tags">
          <div className="flex gap-2 mb-3">
            <Input
              value={tagInput}
              placeholder="Type a custom tag…"
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
            />
            <button
              type="button" onClick={() => addTag(tagInput)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 text-stone-600" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_TAGS.filter(t => !form.tags.includes(t)).map(t => (
              <button key={t} type="button" onClick={() => addTag(t)}
                className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-gold-100 text-stone-500 hover:text-gold-700 rounded-full transition-colors">
                + {t}
              </button>
            ))}
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gold-100 text-gold-800 rounded-full font-medium">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* ── Notes ────────────────────────────────────────────── */}
        <Section title="Notes">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={4}
            placeholder="Topics you discussed, mutual interests, things to remember…"
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
          />
        </Section>

        {/* ── Buttons ───────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 py-4">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 sm:flex-none px-6 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold rounded-lg text-sm transition-colors">
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Connection'}
          </button>
        </div>

      </form>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const selectCls = 'w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white'

function Section({ title, children }) {
  return (
    <div className="px-6 py-5">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-stone-700 mb-1">{children}</label>
}

function Input({ ...props }) {
  return (
    <input
      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
      {...props}
    />
  )
}
