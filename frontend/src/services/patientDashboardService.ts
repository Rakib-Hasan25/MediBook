import { auth } from '@/lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export type SlotType = 'online' | 'offline'

export interface PatientDoctorCard {
  id: string
  uid: string
  name: string
  photo: string | null
  specialization: string
  email: string | null
  licenseNumber: string | null
  status: string | null
  availableSlotCount: number
  nextAvailableDate: string | null
}

export interface PatientDoctorDetails extends Omit<PatientDoctorCard, 'availableSlotCount' | 'nextAvailableDate'> {
  documentUrl: string | null
}

export interface PatientDoctorSlot {
  id: string
  doctorId: string | null
  date: string | null
  startTime: string | null
  endTime: string | null
  capacity: number
  bookedCount: number
  type: SlotType | null
  notes: string | null
  createdAt: string | null
}

interface DoctorListResponse {
  doctors: PatientDoctorCard[]
  filters: {
    specializationOptions: string[]
    typeOptions: SlotType[]
  }
}

interface DoctorDetailsResponse {
  doctor: PatientDoctorDetails
  availableSlots: PatientDoctorSlot[]
}

async function getAuthHeader() {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You are not signed in.')
  }

  const token = await currentUser.getIdToken(true)
  return {
    Authorization: `Bearer ${token}`,
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed')
  }
  return payload
}

export async function getVerifiedDoctorsForPatient(filters: {
  search: string
  specialization: string
  type: '' | SlotType
  date: string
}) {
  const headers = await getAuthHeader()
  const params = new URLSearchParams()

  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.specialization.trim()) params.set('specialization', filters.specialization.trim())
  if (filters.type) params.set('type', filters.type)
  if (filters.date) params.set('date', filters.date)

  const response = await fetch(`${API_BASE_URL}/patient-dashboard/doctors?${params.toString()}`, {
    method: 'GET',
    headers,
  })

  return parseJson<DoctorListResponse>(response)
}

export async function getVerifiedDoctorDetailsForPatient(doctorId: string) {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/patient-dashboard/doctors/${doctorId}`, {
    method: 'GET',
    headers,
  })

  return parseJson<DoctorDetailsResponse>(response)
}
