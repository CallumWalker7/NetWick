/**
 * api.js — Supabase-backed data layer.
 *
 * All data is stored in your Supabase project's PostgreSQL database.
 * Row Level Security ensures each user only ever sees their own data.
 * No backend server needed — Supabase handles everything.
 */
import { supabase } from './lib/supabase'

// ── Helper: get the current user's ID ────────────────────────────────────────
async function uid() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

// ── Helper: normalize tags from DB (Supabase returns JSONB as a JS array) ────
const norm = c => ({ ...c, tags: c?.tags ?? [] })

// ── Public API ────────────────────────────────────────────────────────────────

export const api = {

  // ── Dashboard stats ─────────────────────────────────────────────────────
  async getStats() {
    const { data, error } = await supabase
      .from('connections')
      .select('strength, follow_up_date, created_at')
    if (error) throw error

    const total = data.length
    const byStrength = ['weak', 'medium', 'strong'].map(s => ({
      strength: s,
      count: data.filter(c => c.strength === s).length,
    }))
    const todayStr = new Date().toISOString().split('T')[0]
    const in7 = new Date(); in7.setDate(in7.getDate() + 7)
    const in7Str = in7.toISOString().split('T')[0]
    const followUpSoon = data.filter(c =>
      c.follow_up_date && c.follow_up_date >= todayStr && c.follow_up_date <= in7Str
    ).length
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const newThisMonth = data.filter(c => new Date(c.created_at) >= startOfMonth).length

    return { total, byStrength, followUpSoon, newThisMonth }
  },

  // ── All connections, newest first ───────────────────────────────────────
  async getConnections() {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(norm)
  },

  // ── Single connection + its interaction history ──────────────────────────
  async getConnection(id) {
    const { data, error } = await supabase
      .from('connections')
      .select('*, interactions(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    const interactions = (data.interactions ?? [])
      .sort((a, b) => b.date.localeCompare(a.date))
    return { ...norm(data), interactions }
  },

  // ── Create a new connection ─────────────────────────────────────────────
  async createConnection(form) {
    const { data, error } = await supabase
      .from('connections')
      .insert({
        user_id:       await uid(),
        full_name:     form.full_name?.trim() ?? '',
        company:       form.company       ?? '',
        position:      form.position      ?? '',
        industry:      form.industry      ?? '',
        where_met:     form.where_met     ?? '',
        date_met:      form.date_met      ?? '',
        email:         form.email         ?? '',
        phone:         form.phone         ?? '',
        notes:         form.notes         ?? '',
        strength:      form.strength      ?? 'medium',
        last_contact:  form.last_contact  ?? '',
        follow_up_date:form.follow_up_date ?? '',
        tags:          Array.isArray(form.tags) ? form.tags : [],
      })
      .select()
      .single()
    if (error) throw error
    return norm(data)
  },

  // ── Update an existing connection ───────────────────────────────────────
  async updateConnection(id, form) {
    const { data, error } = await supabase
      .from('connections')
      .update({
        full_name:     form.full_name?.trim() ?? '',
        company:       form.company       ?? '',
        position:      form.position      ?? '',
        industry:      form.industry      ?? '',
        where_met:     form.where_met     ?? '',
        date_met:      form.date_met      ?? '',
        email:         form.email         ?? '',
        phone:         form.phone         ?? '',
        notes:         form.notes         ?? '',
        strength:      form.strength      ?? 'medium',
        last_contact:  form.last_contact  ?? '',
        follow_up_date:form.follow_up_date ?? '',
        tags:          Array.isArray(form.tags) ? form.tags : [],
        updated_at:    new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return norm(data)
  },

  // ── Delete a connection (interactions cascade automatically) ─────────────
  async deleteConnection(id) {
    const { error } = await supabase.from('connections').delete().eq('id', id)
    if (error) throw error
    return { success: true }
  },

  // ── Log an interaction and update last_contact ───────────────────────────
  async addInteraction(connId, form) {
    const { data, error } = await supabase
      .from('interactions')
      .insert({ connection_id: connId, user_id: await uid(), date: form.date, note: form.note })
      .select()
      .single()
    if (error) throw error

    // Keep last_contact up to date
    const { data: conn } = await supabase
      .from('connections').select('last_contact').eq('id', connId).single()
    if (!conn.last_contact || form.date > conn.last_contact) {
      await supabase.from('connections')
        .update({ last_contact: form.date, updated_at: new Date().toISOString() })
        .eq('id', connId)
    }
    return data
  },

  // ── Delete a single interaction ─────────────────────────────────────────
  async deleteInteraction(_connId, intId) {
    const { error } = await supabase.from('interactions').delete().eq('id', intId)
    if (error) throw error
    return { success: true }
  },

  // ── Export all connections as a CSV download ────────────────────────────
  async exportCSV() {
    const { data, error } = await supabase
      .from('connections').select('*').order('full_name')
    if (error) throw error

    const headers = [
      'Name', 'Company', 'Position', 'Industry', 'Where Met', 'Date Met',
      'Email', 'Phone', 'Strength', 'Last Contact', 'Follow-Up Date', 'Tags', 'Notes',
    ]
    const rows = data.map(c => [
      `"${c.full_name}"`, `"${c.company}"`, `"${c.position}"`, `"${c.industry}"`,
      `"${c.where_met}"`, c.date_met, c.email, c.phone, c.strength,
      c.last_contact, c.follow_up_date,
      `"${(c.tags ?? []).join('; ')}"`,
      `"${(c.notes ?? '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'connections.csv',
    })
    a.click()
    URL.revokeObjectURL(a.href)
  },
}
