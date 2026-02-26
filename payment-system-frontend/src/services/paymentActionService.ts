const PAYMENT_FUNCTION_URL =
  import.meta.env.VITE_PAYMENT_FUNCTION_URL ||
  'http://127.0.0.1:4000/medibook-3624a/us-central1/logPaymentAction'

export type PaymentActionType = 'success' | 'fail' | 'delay'

interface PaymentActionPayload {
  action: PaymentActionType
  paymentId: string
  slotid: string
  userid: string
  doctorid: string
}

export async function logPaymentAction(payload: PaymentActionPayload) {
  const response = await fetch(PAYMENT_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  })

  const result = (await response.json()) as {
    result?: { message?: string }
    error?: { message?: string }
    message?: string
  }

  if (!response.ok) {
    throw new Error(result?.error?.message || result?.message || 'Function call failed')
  }

  return result.result ?? result
}
