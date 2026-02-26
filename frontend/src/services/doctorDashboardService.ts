import { auth } from '@/lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export type AppointmentStatus = 'all' | 'pending_payment' | 'confirmed' | 'failed' | 'expired'
export type AppointmentTimeframe = 'all' | 'current' | 'previous'
export type SlotType = 'online' | 'offline'

export interface CreateSlotPayload {
  date: string
  startTime: string
  endTime: string
  capacity: number
  type: SlotType
  notes?: string
}

export interface DoctorAppointment {
  id: string
  slotId: string | null
  doctorId: string
  patientId: string | null
  status: Exclude<AppointmentStatus, 'all'>
  paymentId: string | null
  createdAt: string | null
  expiresAt: string | null
  isCurrent: boolean
  slot: {
    date: string | null
    startTime: string | null
    endTime: string | null
    type: SlotType | null
    notes: string | null
  } | null
}

export interface DoctorAppointmentsResponse {
  appointments: DoctorAppointment[]
  counts: {
    total: number
    current: number
    previous: number
  }
}

export interface DoctorSlot {
  id: string
  doctorId: string
  date: string | null
  startTime: string | null
  endTime: string | null
  capacity: number
  type: SlotType | null
  notes: string | null
  bookedCount: number
  createdAt: string | null
}

export interface DoctorSlotsResponse {
  slots: DoctorSlot[]
  total: number
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

export async function createDoctorSlot(payload: CreateSlotPayload) {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/doctor-dashboard/slots`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseJson<{ message: string; slot: { id: string } }>(response)
}

export async function getDoctorAppointments(filters: {
  status: AppointmentStatus
  timeframe: AppointmentTimeframe
}) {
  const headers = await getAuthHeader()
  const params = new URLSearchParams()
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.timeframe !== 'all') params.set('timeframe', filters.timeframe)
  params.set('limit', '200')

  const response = await fetch(`${API_BASE_URL}/doctor-dashboard/appointments?${params.toString()}`, {
    method: 'GET',
    headers,
  })

  return parseJson<DoctorAppointmentsResponse>(response)
}

export async function getDoctorSlots() {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/doctor-dashboard/slots`, {
    method: 'GET',
    headers,
  })

  return parseJson<DoctorSlotsResponse>(response)
}
