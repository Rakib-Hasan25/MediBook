const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'

export interface PaymentUser {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string | null
  accountStatus: string | null
}

export interface PaymentSlot {
  id: string
  doctorId: string | null
  date: string | null
  startTime: string | null
  endTime: string | null
  type: string | null
  notes: string | null
  capacity: number
  bookedCount: number
  createdAt: string | null
}

export interface PaymentDoctor {
  id: string
  uid: string
  name: string
  email: string | null
  specialization: string | null
  profileImage: string | null
  licenseNumber: string | null
  status: string | null
}

export interface PaymentGatewaySession {
  user: PaymentUser
  slot: PaymentSlot
  doctor: PaymentDoctor
}

export async function getPaymentGatewaySession(slotId: string, userId: string) {
  const searchParams = new URLSearchParams({
    slotid: slotId,
    userid: userId,
  })

  const response = await fetch(`${API_BASE_URL}/payment-gateway/session?${searchParams.toString()}`, {
    method: 'GET',
  })

  const payload = (await response.json()) as {
    session?: PaymentGatewaySession
    message?: string
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to fetch payment session')
  }

  if (!payload.session) {
    throw new Error('Payment session response is invalid')
  }

  return payload.session
}
