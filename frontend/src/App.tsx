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
import type { ReactNode } from 'react'

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole: UserRole
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) return <Navigate to="/signin" replace />
  if (requiredRole === 'doctor' && user.accountStatus !== 'active') {
    if (user.emailStatus === 'unverified') {
      return <Navigate to="/verify-email" replace />
    }
    return <Navigate to="/pending-approval" replace />
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? user.role === 'doctor'
              ? user.accountStatus === 'active'
                ? <Navigate to="/dashboard/doctor" replace />
                : user.emailStatus === 'unverified'
                  ? <Navigate to="/verify-email" replace />
                  : <Navigate to="/pending-approval" replace />
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
          user.accountStatus == 'active' &&
          user.emailStatus == 'verified'
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
