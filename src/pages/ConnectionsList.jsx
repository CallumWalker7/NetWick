import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Download, Plus, ChevronUp, ChevronDown, Users } from 'lucide-react'
import { api } from '../api'
import StrengthBadge from '../components/StrengthBadge'
import { formatDate, daysUntil } from '../utils'

export default function ConnectionsList() {
  const navigate = useNavigate()
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStrength, setFilterStrength] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    api.getConnections().then(data => { setConnections(data); setLoading(false) })
  }, [])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = connections
    .filter(c => {
      const q = search.toLowerCase()
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q) ||
        (c.position ?? '').toLowerCase().includes(q) ||
        (c.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    })
    .filter(c => filterStrength ? c.strength === filterStrength : true)
    .sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  const columns = [
    { label: 'Name',        field: 'full_name' },
    { label: 'Company',     field: 'company' },
    { label: 'Role',        field: 'position' },
    { label: 'Strength',    field: 'strength' },
    { label: 'Last Contact', field: 'last_contact' },
    { label: 'Follow-Up',   field: 'follow_up_date' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Connections</h1>
          <p className="text-stone-500 mt-1">{connections.length} contacts in your network</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={api.exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-100 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <Link
            to="/connections/new"
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold rounded-lg text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, company, role, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
          />
        </div>
        <select
          value={filterStrength}
          onChange={e => setFilterStrength(e.target.value)}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
        >
          <option value="">All Strengths</option>
          <option value="strong">Strong</option>
          <option value="medium">Medium</option>
          <option value="weak">Weak</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="h-8 w-8 border-4 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No connections found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  {columns.map(col => (
                    <th
                      key={col.field}
                      onClick={() => toggleSort(col.field)}
                      className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer select-none hover:text-stone-800 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field
                          ? sortDir === 'asc'
                            ? <ChevronUp className="h-3 w-3 text-gold-500" />
                            : <ChevronDown className="h-3 w-3 text-gold-500" />
                          : <ChevronUp className="h-3 w-3 text-stone-300" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(conn => {
                  const days = daysUntil(conn.follow_up_date)
                  const overdue = conn.follow_up_date && days < 0
                  const soonish = conn.follow_up_date && days >= 0 && days <= 7

                  return (
                    <tr
                      key={conn.id}
                      onClick={() => navigate(`/connections/${conn.id}`)}
                      className={`hover:bg-gold-50 cursor-pointer transition-colors ${overdue ? 'bg-red-50/60' : ''}`}
                    >
                      {/* Name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-sm shrink-0">
                            {conn.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">{conn.full_name}</p>
                            {conn.tags?.length > 0 && (
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {conn.tags.slice(0, 2).map(t => (
                                  <span key={t} className="text-xs px-1.5 py-0 bg-gold-50 text-gold-600 rounded">
                                    {t}
                                  </span>
                                ))}
                                {conn.tags.length > 2 && (
                                  <span className="text-xs text-stone-400">+{conn.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{conn.company || '—'}</td>
                      <td className="px-4 py-3 text-stone-600">{conn.position || '—'}</td>
                      <td className="px-4 py-3"><StrengthBadge strength={conn.strength} /></td>
                      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                        {conn.last_contact ? formatDate(conn.last_contact) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {conn.follow_up_date ? (
                          <span className={`font-medium ${overdue ? 'text-red-600' : soonish ? 'text-gold-600' : 'text-stone-600'}`}>
                            {overdue && '⚠ '}{formatDate(conn.follow_up_date)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
