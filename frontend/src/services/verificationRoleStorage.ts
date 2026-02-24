import type { UserRole } from '@/lib/api'

export const VERIFY_ROLE_STORAGE_KEY = 'verify-email-role'

export function setVerificationRole(role: UserRole) {
  sessionStorage.setItem(VERIFY_ROLE_STORAGE_KEY, role)
}

export function getVerificationRole(): UserRole | null {
  const role = sessionStorage.getItem(VERIFY_ROLE_STORAGE_KEY)
  if (role === 'doctor' || role === 'patient') return role
  return null
}

export function clearVerificationRole() {
  sessionStorage.removeItem(VERIFY_ROLE_STORAGE_KEY)
}
