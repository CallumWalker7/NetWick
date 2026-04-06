import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ConnectionsList from './pages/ConnectionsList'
import ConnectionForm from './pages/ConnectionForm'
import ConnectionDetail from './pages/ConnectionDetail'
import Opportunities from './pages/Opportunities'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* All other routes require a logged-in user */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Routes>
                    <Route path="/"                       element={<Dashboard />} />
                    <Route path="/connections"            element={<ConnectionsList />} />
                    <Route path="/connections/new"        element={<ConnectionForm />} />
                    <Route path="/connections/:id"        element={<ConnectionDetail />} />
                    <Route path="/connections/:id/edit"   element={<ConnectionForm />} />
                    <Route path="/opportunities"          element={<Opportunities />} />
                    <Route path="*"                       element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
