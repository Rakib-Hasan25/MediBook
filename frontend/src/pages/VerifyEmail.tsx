import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import ToastMessage from '@/components/ToastMessage'
import { useAuth } from '@/context/AuthContext'
import { syncPatientEmailVerificationFromSession } from '@/services/patientAuthService'
import { syncDoctorEmailVerificationFromSession } from '@/services/doctorAuthService'
import { getVerificationRole } from '@/services/verificationRoleStorage'

const CHECKED_ONCE_STORAGE_KEY = 'verify-email-checked-once'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [isVerifiedNow, setIsVerifiedNow] = useState(false)
  const [checkedOnce, setCheckedOnce] = useState(
    () => sessionStorage.getItem(CHECKED_ONCE_STORAGE_KEY) === '1',
  )
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let isMounted = true

    const verify = async () => {
      setLoading(true)
      try {
        const targetRole = getVerificationRole() || user?.role || 'patient'
        const syncedUser =
          targetRole === 'doctor'
            ? await syncDoctorEmailVerificationFromSession()
            : await syncPatientEmailVerificationFromSession()

        if (!syncedUser) {
          if (!isMounted) return
          sessionStorage.setItem(CHECKED_ONCE_STORAGE_KEY, '1')
          setCheckedOnce(true)
          setLoading(false)
          return
        }

        await refreshProfile()

        if (!isMounted) return
        sessionStorage.removeItem(CHECKED_ONCE_STORAGE_KEY)
        setCheckedOnce(true)
        setIsVerifiedNow(true)
        setLoading(false)
        setToast({ message: 'Email verified successfully.', type: 'success' })

        setTimeout(() => {
          if (syncedUser.role === 'doctor') {
            navigate('/pending-approval')
          } else {
            navigate('/dashboard/patient')
          }
        }, 900)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Email verification failed.'
        if (!isMounted) return
        setCheckedOnce(true)
        setToast({ message, type: 'error' })
        
        setTimeout(() => {
          navigate('/signup')
        }, 900)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void verify()

    return () => {
      isMounted = false
    }
  }, [navigate, refreshProfile, user?.role])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <MailCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verify Your Email</h1>
        </div>

        <ToastMessage message={toast?.message || ''} type={toast?.type || 'success'} />

        {loading ? (
          <p className="text-slate-600 text-sm">
            Checking your verification status...
          </p>
        ) : isVerifiedNow ? (
          <p className="text-slate-600 text-sm">Verification completed. Redirecting...</p>
        ) : (
          <>
            <p className="text-slate-600 text-sm">
              We sent a verification email to your inbox. Please click the link from your email to activate your account.
            </p>
            {checkedOnce && <p className="text-slate-500 text-xs">Email is not verified yet.</p>}
            <div className="text-sm">
              <span className="text-slate-500">Already verified? </span>
              <Link to="/signin" className="text-blue-600 font-semibold hover:underline">
                Go to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
