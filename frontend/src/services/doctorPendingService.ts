import { auth } from '@/lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export type DoctorPendingRecord = {
  uid: string
  name: string | null
  email: string | null
  profile_image: string | null
  license_number: string | null
  document_url: string | null
  specialization: string | null
  'doctor-status': string | null
}

export type SaveDoctorPendingPayload = {
  profile_image: string | null
  license_number: string
  document_url: string | null
  specialization: string
}

async function getFreshIdToken() {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You are not signed in. Please sign in again.')
  }
  return currentUser.getIdToken(true)
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string; error?: string }
  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Request failed')
  }
  return payload
}

export async function uploadDoctorImage(file: File): Promise<string> {
  const token = await getFreshIdToken()
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE_URL}/uploads/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const payload = await parseJson<{ url: string }>(res)
  if (!payload.url) {
    throw new Error('Upload failed. No URL returned.')
  }
  return payload.url
}

export async function fetchDoctorPendingProfile(): Promise<{
  exists: boolean
  doctor: DoctorPendingRecord | null
}> {
  const token = await getFreshIdToken()
  const res = await fetch(`${API_BASE_URL}/auth/doctors/pending-profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return parseJson<{ exists: boolean; doctor: DoctorPendingRecord | null }>(res)
}

export async function saveDoctorPendingProfile(
  payload: SaveDoctorPendingPayload,
): Promise<{ message: string; doctor: DoctorPendingRecord }> {
  const token = await getFreshIdToken()
  const res = await fetch(`${API_BASE_URL}/auth/doctors/pending-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  return parseJson<{ message: string; doctor: DoctorPendingRecord }>(res)
}
