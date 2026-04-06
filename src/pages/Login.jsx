// Login.jsx — handles both sign-in and sign-up on one page
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Network, Mail, Lock, ArrowRight, Loader } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode]           = useState('signin')   // 'signin' | 'signup'
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  // Already logged in — go straight to the dashboard
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
        // AuthContext listener will update user → ProtectedRoute will let us through
      } else {
        await signUp(email, password)
        setSuccess(
          'Account created! Check your email for a confirmation link, then come back and sign in.'
        )
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src="/favicon.png" alt="Brunswick School" className="h-14 w-14" />
        <span className="text-2xl font-bold text-navy-900 tracking-tight">NetWick</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm w-full max-w-sm p-8">

        {/* Mode toggle */}
        <div className="flex bg-stone-100 rounded-lg p-1 mb-6">
          {[
            { key: 'signin', label: 'Sign In' },
            { key: 'signup', label: 'Create Account' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setMode(tab.key); setError(''); setSuccess('') }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === tab.key
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-stone-500 hover:text-navy-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <h1 className="text-xl font-bold text-stone-800 mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Get started'}
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          {mode === 'signin'
            ? 'Sign in to access your network.'
            : 'Create an account to save your connections to the cloud.'}
        </p>

        {/* Error / success banners */}
        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <input
                type="password" required minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-navy-950 font-semibold rounded-lg text-sm transition-colors mt-2"
          >
            {loading
              ? <Loader className="h-4 w-4 animate-spin" />
              : <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>}
          </button>
        </form>

      </div>

      <p className="mt-6 text-xs text-stone-400 text-center max-w-xs">
        Your data is stored securely in the cloud and tied to your account.
        Each account only has access to its own connections.
      </p>
    </div>
  )
}
