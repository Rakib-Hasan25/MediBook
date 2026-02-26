const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'

export interface InitiatedAppointment {
  id: string
  slotId: string
  doctorId: string | null
  patientId: string
  status: 'pending_payment'
  paymentId: string
  expiresAt: string
}

export interface InitiatedPayment {
  id: string
  appointmentId: string
  transactionId: string
  amount: number
  status: 'pending'
}

export interface PaymentListItem {
  id: string
  transactionId: string | null
  amount: number
  status: string
  createdAt: string | null
  appointment: {
    id: string | null
    slotId: string | null
    patientId: string | null
    doctorId: string | null
    status: string | null
    paymentId: string | null
    expiresAt: string | null
  } | null
}

export async function initiatePayment(slotId: string, userId: string) {
  const response = await fetch(`${API_BASE_URL}/payment-gateway/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slotid: slotId,
      userid: userId,
    }),
  })

  const payload = (await response.json()) as {
    appointment?: InitiatedAppointment
    payment?: InitiatedPayment
    message?: string
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to initiate payment')
  }

  const appointment = payload.appointment
  const payment = payload.payment

  if (!appointment || !payment) {
    throw new Error('Payment initiation response is invalid')
  }

  return {
    appointment,
    payment,
  }
}

export async function getPaymentList(slotId: string, userId: string) {
  const searchParams = new URLSearchParams({
    slotid: slotId,
    userid: userId,
    limit: '50',
  })

  const response = await fetch(`${API_BASE_URL}/payment-gateway/payments?${searchParams.toString()}`, {
    method: 'GET',
  })

  const payload = (await response.json()) as {
    payments?: PaymentListItem[]
    message?: string
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to fetch payment list')
  }

  return payload.payments || []
}
