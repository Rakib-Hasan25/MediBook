import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getPaymentGatewaySession,
  type PaymentGatewaySession,
} from '@/services/paymentGatewayService'
import { logPaymentAction, type PaymentActionType } from '@/services/paymentActionService'
import { getPaymentList, initiatePayment, type PaymentListItem } from '@/services/paymentService'

function App() {
  const [session, setSession] = useState<PaymentGatewaySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [callingAction, setCallingAction] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [payments, setPayments] = useState<PaymentListItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const params = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const slotId = searchParams.get('slotId') ?? searchParams.get('slotid')
    const userId =
      searchParams.get('userId') ??
      searchParams.get('userid') ??
      searchParams.get('patientId') ??
      searchParams.get('patientid')

    return { slotId, userId }
  }, [])

  useEffect(() => {
    const { slotId, userId } = params
    if (!slotId || !userId) {
      setError('slotid and userid are required in the URL')
      setLoading(false)
      return
    }

    const loadSession = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getPaymentGatewaySession(slotId, userId)
        setSession(response)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load payment session')
      } finally {
        setLoading(false)
      }
    }

    void loadSession()
  }, [params])

  useEffect(() => {
    const { slotId, userId } = params
    if (!slotId || !userId) return

    const loadPayments = async () => {
      try {
        setPaymentsLoading(true)
        const paymentRows = await getPaymentList(slotId, userId)
        setPayments(paymentRows)
      } catch {
        setPayments([])
      } finally {
        setPaymentsLoading(false)
      }
    }

    void loadPayments()
  }, [params])

  const slot = session?.slot
  const doctor = session?.doctor
  const user = session?.user

  const refreshPayments = async (slotId: string, userId: string) => {
    try {
      setPaymentsLoading(true)
      const paymentRows = await getPaymentList(slotId, userId)
      setPayments(paymentRows)
    } catch {
      setPayments([])
    } finally {
      setPaymentsLoading(false)
    }
  }

  const handlePaymentAction = async (action: PaymentActionType) => {
    if (!slot?.id || !user?.id || !doctor?.id) {
      setActionMessage('Missing slot/user/doctor details.')
      return
    }

    try {
      setCallingAction(true)
      setActionMessage('')
      const initiated = await initiatePayment(slot.id, user.id)
      setActionMessage(`Payment initiated: ${initiated.payment.transactionId}`)

      await new Promise(resolve => {
        setTimeout(resolve, 2500)
      })

      await logPaymentAction({
        action,
        paymentId: initiated.payment.id,
        slotid: slot.id,
        userid: user.id,
        doctorid: doctor.id,
      })

      await refreshPayments(slot.id, user.id)
      setActionMessage(`Function called for ${initiated.payment.transactionId} with state "${action}".`)
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : 'Function call failed')
    } finally {
      setCallingAction(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_35%,#f8fafc_100%)] p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                MediBook Payments
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Secure Checkout</h1>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              SSL Secured
            </span>
          </div>

          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading payment details...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && session && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                  <p className="mt-1 font-semibold text-slate-900">{user?.name || 'N/A'}</p>
                  <p className="text-sm text-slate-600">{user?.email || user?.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                  <p className="mt-1 font-semibold text-slate-900">{doctor?.name || 'N/A'}</p>
                  <p className="text-sm text-slate-600">{doctor?.specialization || 'General'}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                <Info label="Slot ID" value={slot?.id || params.slotId || 'N/A'} />
                <Info label="User ID" value={user?.id || params.userId || 'N/A'} />
                <Info label="Date" value={slot?.date || 'N/A'} />
                <Info label="Time" value={formatTimeRange(slot?.startTime, slot?.endTime)} />
                <Info label="Type" value={slot?.type || 'N/A'} />
                <Info label="Capacity" value={`${slot?.bookedCount ?? 0} / ${slot?.capacity ?? 0}`} />
              </div>

              {slot?.notes && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  <span className="font-semibold">Doctor Notes:</span> {slot.notes}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
          <p className="mt-1 text-sm text-slate-600">Consultation payment (demo gateway)</p>

          <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Consultation Fee</span>
              <span className="font-medium text-slate-900">৳500</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Gateway Charge</span>
              <span className="font-medium text-slate-900">৳0</span>
            </div>
            <div className="border-t border-slate-200 pt-2" />
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>৳500</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Button
              className="w-full"
              variant="success"
              disabled={loading || Boolean(error) || callingAction}
              onClick={() => void handlePaymentAction('success')}
            >
              Pay Success
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              disabled={loading || Boolean(error) || callingAction}
              onClick={() => void handlePaymentAction('fail')}
            >
              Pay Fail
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading || Boolean(error) || callingAction}
              onClick={() => void handlePaymentAction('delay')}
            >
              Delay Payment
            </Button>
          </div>
          {actionMessage && <p className="mt-3 text-sm text-slate-600">{actionMessage}</p>}

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Payments</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={paymentsLoading || !slot?.id || !user?.id}
                onClick={() => {
                  if (!slot?.id || !user?.id) return
                  void refreshPayments(slot.id, user.id)
                }}
              >
                Refresh
              </button>
            </div>
            {paymentsLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading payments...</p>
            ) : payments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No payments yet.</p>
            ) : (
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {payments.map(payment => (
                  <div key={payment.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-900">{payment.transactionId || payment.id}</p>
                    <p className="text-slate-600">State: {payment.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}

function formatTimeRange(startTime: string | null | undefined, endTime: string | null | undefined) {
  if (!startTime && !endTime) return 'N/A'
  if (!startTime) return endTime || 'N/A'
  if (!endTime) return startTime
  return `${startTime} - ${endTime}`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  )
}

export default App
