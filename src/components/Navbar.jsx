import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Network, LayoutDashboard, Users, Sparkles, Plus, LogOut, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { to: '/',              label: 'Dashboard',     Icon: LayoutDashboard },
    { to: '/connections',   label: 'Connections',   Icon: Users },
    { to: '/opportunities', label: 'Opportunities', Icon: Sparkles },
  ]

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  // Shorten email for display: "jane.smith@gmail.com" → "jane.smith"
  const displayName = user?.email?.split('@')[0] ?? 'Account'

  return (
    <nav className="bg-navy-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/favicon.png" alt="Brunswick School" className="h-9 w-9" />
            <span className="text-lg font-bold text-white tracking-tight">NetWick</span>
          </Link>

          <div className="flex items-center gap-1">

            {/* Nav links */}
            {navLinks.map(({ to, label, Icon }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-700 text-white'
                      : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}

            {/* Add contact button */}
            <Link
              to="/connections/new"
              className="flex items-center gap-2 ml-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-950 font-semibold rounded-lg text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Link>

            {/* User menu */}
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-navy-200 hover:bg-navy-700 hover:text-white transition-colors text-sm"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <>
                  {/* Click-away overlay */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-stone-200 shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-xs text-stone-400 font-medium">Signed in as</p>
                      <p className="text-sm text-stone-700 font-semibold truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  )
}
