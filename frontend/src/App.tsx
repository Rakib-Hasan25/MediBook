import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import VerifyEmail from './pages/VerifyEmail'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import PatientDoctorDetails from './pages/PatientDoctorDetails'
import PendingApproval from './pages/PendingApproval'
import type { UserRole } from './lib/api'
import { useEffect, useState, type ReactNode } from 'react'
import {
  getDoctorRouteAccessStatus,
  type DoctorRouteAccessStatus,
} from './services/doctorRouteAccessService'

function useDoctorRouteAccess({
  shouldCheck,
  doctorUid,
}: {
  shouldCheck: boolean
  doctorUid: string | null
}) {
  const [resolvedAccess, setResolvedAccess] = useState<{
    uid: string
    status: DoctorRouteAccessStatus
  } | null>(null)

  useEffect(() => {
    if (!shouldCheck || !doctorUid) {
      return
    }

    let isMounted = true

    getDoctorRouteAccessStatus()
      .then(nextStatus => {
        if (!isMounted) return
        setResolvedAccess({ uid: doctorUid, status: nextStatus })
      })
      .catch(() => {
        if (!isMounted) return
        setResolvedAccess({ uid: doctorUid, status: 'pending' })
      })

    return () => {
      isMounted = false
    }
  }, [shouldCheck, doctorUid])

  if (!shouldCheck || !doctorUid) {
    return 'loading' as const
  }

  if (!resolvedAccess || resolvedAccess.uid !== doctorUid) {
    return 'loading' as const
  }

  return resolvedAccess.status
}

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole: UserRole
}) {
  const { user, loading } = useAuth()
  const shouldCheckDoctorAccess =
    requiredRole === 'doctor' && user?.role === 'doctor' && user.emailStatus === 'verified'
  const doctorAccessStatus = useDoctorRouteAccess({
    shouldCheck: shouldCheckDoctorAccess,
    doctorUid: user?.uid || null,
  })

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) return <Navigate to="/signin" replace />
  if (requiredRole === 'doctor') {
    if (user.emailStatus === 'unverified') {
      return <Navigate to="/verify-email" replace />
    }
    if (user.role !== 'doctor') {
      return <Navigate to={`/dashboard/${user.role}`} replace />
    }
    if (doctorAccessStatus === 'loading') {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }
    if (doctorAccessStatus === 'verified') {
      return <>{children}</>
    }
    if (doctorAccessStatus === 'pending') {
      return <Navigate to="/pending-approval" replace />
    }
    return <Navigate to="/signin" replace />
  }
  if (requiredRole === 'patient' && user.accountStatus !== 'active') {
    return <Navigate to="/verify-email" replace />
  }
  if (user.role !== requiredRole) {
    return <Navigate to={`/dashboard/${user.role}`} replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const shouldCheckDoctorAccess =
    user?.role === 'doctor' && user.emailStatus === 'verified'
  const doctorAccessStatus = useDoctorRouteAccess({
    shouldCheck: shouldCheckDoctorAccess,
    doctorUid: user?.uid || null,
  })

  if (loading || (shouldCheckDoctorAccess && doctorAccessStatus === 'loading')) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? user.role === 'doctor'
              ? user.emailStatus === 'unverified'
                ? <Navigate to="/verify-email" replace />
                : doctorAccessStatus === 'verified'
                  ? <Navigate to="/dashboard/doctor" replace />
                  : doctorAccessStatus === 'pending'
                    ? <Navigate to="/pending-approval" replace />
                    : <Navigate to="/signin" replace />
              : user.accountStatus === 'active'
                ? <Navigate to="/dashboard/patient" replace />
                : <Navigate to="/verify-email" replace />
            : <Navigate to="/signin" replace />
        }
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route
        path="/pending-approval"
        element={
          user?.role === 'doctor' &&
          user.emailStatus === 'verified' &&
          doctorAccessStatus === 'pending'
            ? <PendingApproval />
            : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="/dashboard/doctor"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/patient/:doctorId"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientDoctorDetails />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
