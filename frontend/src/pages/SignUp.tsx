import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Activity,
  Mail,
  Lock,
  User,
  Stethoscope,
  Heart,
  CheckCircle,
  ArrowRight,
  Globe,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '@/lib/api'
import ToastMessage from '@/components/ToastMessage'
import { registerPatientByEmail, registerPatientByGoogle } from '@/services/patientAuthService'
import { registerDoctorByEmail, registerDoctorByGoogle } from '@/services/doctorAuthService'

export default function SignUp() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()


  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [error, setError] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const setToastMessage = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError('')
    setLoadingEmail(true)

    try {
      if (role === 'doctor') {
        await registerDoctorByEmail({ name, email, password })
        setToastMessage('Signup successful. Verification email sent.', 'success')
        navigate('/verify-email')
        return
      } else {
        await registerPatientByEmail({ name, email, password })
        setToastMessage('Signup successful. Verification email sent.', 'success')
        navigate('/verify-email')
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      setError(message)
      setToastMessage(message, 'error')
    } finally {
      setLoadingEmail(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoadingGoogle(true)
    try {
      if (role === 'doctor') {
        await registerDoctorByGoogle()
      } else {
        await registerPatientByGoogle()
      }
      await refreshProfile()
      setToastMessage('Google signup successful.', 'success')
      navigate(role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google signup failed'
      setError(message)
      setToastMessage(message, 'error')
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
          <div className="absolute top-1/3 -left-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute bottom-24 right-1/3 w-64 h-64 bg-white/5 rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">MediBook</span>
          </div>

          <h1 className="text-white text-5xl font-bold leading-tight mb-6">
            Join the<br />MediBook<br />Family.
          </h1>
          <p className="text-teal-50 text-lg mb-12 leading-relaxed max-w-sm">
            Whether you're a doctor or a patient, we have everything you need for a seamless healthcare experience.
          </p>

          <div className="space-y-4">
            {[
              'Free registration for all users',
              'Verified and trusted doctors',
              'Instant appointment confirmation',
              '24/7 support available',
            ].map(text => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-200 flex-shrink-0" />
                <span className="text-teal-50 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/15 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Join 50,000+ users</div>
              <div className="text-teal-100 text-sm">Already trusting MediBook with their health</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 text-xl font-bold">MediBook</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">Create account</h2>
          <p className="text-slate-500 mb-6">Join MediBook and start your health journey today.</p>

          {/* Role Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">I am a...</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  role === 'patient'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Heart className={`w-6 h-6 mb-2 ${role === 'patient' ? 'text-teal-600' : 'text-slate-400'}`} />
                <div className={`font-semibold text-sm ${role === 'patient' ? 'text-teal-700' : 'text-slate-600'}`}>
                  Patient
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Book appointments</div>
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
                <div className="text-xs text-slate-400 mt-0.5">Manage patients</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ToastMessage message={toast?.message || ''} type={toast?.type || 'success'} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. Jane Smith' : 'Jane Smith'}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingEmail || loadingGoogle}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loadingEmail ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
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
              onClick={handleGoogleSignup}
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
            Already have an account?{' '}
            <Link to="/signin" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
