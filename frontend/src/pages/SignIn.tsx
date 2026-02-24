import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Activity,
  Mail,
  Lock,
  Heart,
  Stethoscope,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  Globe,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '@/lib/api'
import { signInByEmail, signInByGoogle } from '@/services/signInService'

export default function SignIn() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [error, setError] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoadingEmail(true)
    try {
      const result = await signInByEmail({ email, password, role })
      if (result.status === 'verify_email') {
        navigate('/verify-email')
        return
      }
      await refreshProfile()
      navigate(result.nextRoute)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      setError(message)
    } finally {
      setLoadingEmail(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoadingGoogle(true)
    try {
      const result = await signInByGoogle(role)
      if (result.status === 'verify_email') {
        navigate('/verify-email')
        return
      }
      await refreshProfile()
      navigate(result.nextRoute)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      setError(message)
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
          <div className="absolute top-1/3 -left-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute bottom-24 right-1/3 w-64 h-64 bg-white/5 rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">MediBook</span>
          </div>

          <h1 className="text-white text-5xl font-bold leading-tight mb-6">
            Your Health,<br />Our Priority.
          </h1>
          <p className="text-blue-100 text-lg mb-12 leading-relaxed max-w-sm">
            Connect with top doctors, manage appointments, and take control of your healthcare journey.
          </p>

          <div className="space-y-4">
            {[
              { icon: Users, text: '10,000+ Verified Doctors' },
              { icon: Calendar, text: 'Easy Appointment Booking' },
              { icon: Shield, text: 'Secure & Private Records' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-50 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '10K+', label: 'Doctors' },
            { value: '50K+', label: 'Patients' },
            { value: '99%', label: 'Satisfaction' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/15 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10">
              <div className="text-white text-2xl font-bold">{value}</div>
              <div className="text-blue-100 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 text-xl font-bold">MediBook</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h2>
          <p className="text-slate-500 mb-8">Sign in to continue your healthcare journey.</p>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Sign in as</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  role === 'patient'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Heart className={`w-6 h-6 mb-2 ${role === 'patient' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className={`font-semibold text-sm ${role === 'patient' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Patient
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Access patient dashboard</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  role === 'doctor'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Stethoscope className={`w-6 h-6 mb-2 ${role === 'doctor' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className={`font-semibold text-sm ${role === 'doctor' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Doctor
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Access doctor dashboard</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingEmail || loadingGoogle}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loadingEmail ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingEmail || loadingGoogle}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loadingGoogle ? (
                <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Continue with Google
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
