export type UserRole = 'doctor' | 'patient'
export type AccountStatus = 'active' | 'pending_verification' | 'rejected'
export type EmailStatus = 'verified' | 'unverified'

export interface AppUser {
  uid: string
  email: string
  name: string
  role: UserRole
  accountStatus: AccountStatus
  emailStatus?: EmailStatus
}

export interface SignInResolutionResponse {
  user: AppUser
  message: string
  nextRoute?: '/dashboard/patient' | '/dashboard/doctor' | '/pending-approval'
  requiresEmailVerification?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed')
  }
  return payload
}

export async function signupUser(
  token: string,
  payload: { name: string; role: UserRole },
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}

export async function signinUser(
  token: string,
  payload: { role: UserRole },
): Promise<SignInResolutionResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<SignInResolutionResponse>(res)
}

export async function getCurrentUser(token: string): Promise<{ user: AppUser }> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return parseJson<{ user: AppUser }>(res)
}

export async function registerPatientWithEmail(
  token: string,
  payload: { name: string },
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/patients/register-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}

export async function registerPatientWithGoogle(
  token: string,
  payload: { name: string },
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/patients/register-google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}

export async function markPatientEmailVerified(
  token: string,
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/patients/email-verified`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}

export async function registerDoctorWithEmail(
  token: string,
  payload: { name: string },
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/doctors/register-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}

export async function registerDoctorWithGoogle(
  token: string,
  payload: { name: string },
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/doctors/register-google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}

export async function markDoctorEmailVerified(
  token: string,
): Promise<{ user: AppUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/doctors/email-verified`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return parseJson<{ user: AppUser; message: string }>(res)
}
