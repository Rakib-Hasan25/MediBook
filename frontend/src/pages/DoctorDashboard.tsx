import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock3, LogOut, PlusCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  createDoctorSlot,
  getDoctorAppointments,
  getDoctorSlots,
  type AppointmentStatus,
  type AppointmentTimeframe,
  type DoctorAppointment,
  type DoctorSlot,
  type SlotType,
} from '@/services/doctorDashboardService'

const STATUS_LABEL: Record<Exclude<AppointmentStatus, 'all'>, string> = {
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  failed: 'Failed',
  expired: 'Expired',
}

const STATUS_BADGE_CLASS: Record<Exclude<AppointmentStatus, 'all'>, string> = {
  pending_payment: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  expired: 'bg-slate-200 text-slate-700',
}

const APPOINTMENT_STATUS_OPTIONS: { label: string; value: AppointmentStatus }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending Payment', value: 'pending_payment' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Expired', value: 'expired' },
]

const TIMEFRAME_OPTIONS: { label: string; value: AppointmentTimeframe }[] = [
  { label: 'All', value: 'all' },
  { label: 'Current', value: 'current' },
  { label: 'Previous', value: 'previous' },
]

type SlotForm = {
  date: string
  startTime: string
  endTime: string
  capacity: number
  type: SlotType
  notes: string
}

function formatDateTime(date: string | null, time: string | null) {
  if (!date || !time) return 'Not available'
  const value = new Date(`${date}T${time}:00`)
  if (Number.isNaN(value.getTime())) return `${date} ${time}`
  return value.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatIso(value: string | null) {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

export default function DoctorDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [slotForm, setSlotForm] = useState<SlotForm>({
    date: '',
    startTime: '',
    endTime: '',
    capacity: 1,
    type: 'online',
    notes: '',
  })
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [slots, setSlots] = useState<DoctorSlot[]>([])
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus>('all')
  const [timeframeFilter, setTimeframeFilter] = useState<AppointmentTimeframe>('current')
  const [counts, setCounts] = useState({ total: 0, current: 0, previous: 0 })

  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [submittingSlot, setSubmittingSlot] = useState(false)
  const [slotMessage, setSlotMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true)
      setErrorMessage('')
      const data = await getDoctorAppointments({
        status: statusFilter,
        timeframe: timeframeFilter,
      })
      setAppointments(data.appointments)
      setCounts(data.counts)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load appointments')
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadSlots = async () => {
    try {
      const data = await getDoctorSlots()
      setSlots(data.slots)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load slots')
    }
  }

  useEffect(() => {
    void loadAppointments()
  }, [statusFilter, timeframeFilter])

  useEffect(() => {
    void loadSlots()
  }, [])

  const handleSlotInput = <K extends keyof SlotForm>(key: K, value: SlotForm[K]) => {
    setSlotMessage('')
    setErrorMessage('')
    setSlotForm(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingSlot(true)
    setSlotMessage('')
    setErrorMessage('')

    try {
      await createDoctorSlot({
        date: slotForm.date,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        capacity: slotForm.capacity,
        type: slotForm.type,
        notes: slotForm.notes,
      })

      setSlotMessage('Slot created successfully.')
      setSlotForm(prev => ({
        ...prev,
        startTime: '',
        endTime: '',
        capacity: 1,
        notes: '',
      }))
      await loadAppointments()
      await loadSlots()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create slot')
    } finally {
      setSubmittingSlot(false)
    }
  }

  const headerStats = useMemo(
    () => [
      { label: 'Total Appointments', value: counts.total },
      { label: 'Current', value: counts.current },
      { label: 'Previous', value: counts.previous },
    ],
    [counts],
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Doctor Dashboard</h1>
              <p className="text-xs text-slate-500">Manage your slots and appointment workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 sm:block">
              {user?.name || 'Doctor'}
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-6 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-100">Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Manage consultations with confidence</h2>
          <p className="mt-2 max-w-2xl text-sm text-blue-50">
            Create slots, monitor appointment status, and keep your schedule up to date from one place.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {headerStats.map(item => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[380px,1fr]">
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Create New Slot</h2>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label htmlFor="slot-date" className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  id="slot-date"
                  type="date"
                  value={slotForm.date}
                  onChange={event => handleSlotInput('date', event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    id="start-time"
                    type="time"
                    value={slotForm.startTime}
                    onChange={event => handleSlotInput('startTime', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    id="end-time"
                    type="time"
                    value={slotForm.endTime}
                    onChange={event => handleSlotInput('endTime', event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 mb-1">
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min={1}
                    value={slotForm.capacity}
                    onChange={event => handleSlotInput('capacity', Number(event.target.value))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="slot-type" className="block text-sm font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    id="slot-type"
                    value={slotForm.type}
                    onChange={event => handleSlotInput('type', event.target.value as SlotType)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={slotForm.notes}
                  onChange={event => handleSlotInput('notes', event.target.value)}
                  placeholder="Example: Bring your recent reports"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSlot}
                className="mt-2 w-full cursor-pointer rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingSlot ? 'Creating Slot...' : 'Create Slot'}
              </button>
            </form>

            {slotMessage && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {slotMessage}
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">My Appointments</h2>
                  <p className="text-sm text-slate-500">View current and previous appointments</p>
                </div>

                <button
                  onClick={() => {
                    void loadAppointments()
                    void loadSlots()
                  }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-b border-slate-200 bg-slate-50 p-5">
              <div className="min-w-[180px]">
                <label htmlFor="status-filter" className="block text-xs text-slate-500 mb-1">
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value as AppointmentStatus)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {APPOINTMENT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[180px]">
                <label htmlFor="timeframe-filter" className="block text-xs text-slate-500 mb-1">
                  Show timeframe
                </label>
                <select
                  id="timeframe-filter"
                  value={timeframeFilter}
                  onChange={event => setTimeframeFilter(event.target.value as AppointmentTimeframe)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIMEFRAME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {loadingAppointments && (
                <div className="p-6 text-sm text-slate-500">Loading appointments...</div>
              )}

              {!loadingAppointments && appointments.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  No appointments found for the selected filters.
                </div>
              )}

              {!loadingAppointments &&
                appointments.map(appointment => (
                  <div key={appointment.id} className="p-5 transition hover:bg-slate-50/50">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Appointment ID</p>
                        <p className="font-medium text-slate-900">{appointment.id}</p>
                      </div>
                      <span
                        className={`h-fit rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[appointment.status]}`}
                      >
                        {STATUS_LABEL[appointment.status]}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-slate-500">Patient ID</p>
                        <p className="text-slate-900 font-medium mt-1">{appointment.patientId || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-slate-500">Slot Time</p>
                        <p className="text-slate-900 font-medium mt-1">
                          {formatDateTime(appointment.slot?.date || null, appointment.slot?.startTime || null)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-slate-500">Mode</p>
                        <p className="text-slate-900 font-medium mt-1 capitalize">
                          {appointment.slot?.type || 'N/A'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-slate-500">Created</p>
                        <p className="text-slate-900 font-medium mt-1">{formatIso(appointment.createdAt)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-slate-500">Expires At</p>
                        <p className="text-slate-900 font-medium mt-1">{formatIso(appointment.expiresAt)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-slate-500">Window</p>
                        <p className="text-slate-900 font-medium mt-1 inline-flex items-center gap-1">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          {appointment.isCurrent ? 'Current' : 'Previous'}
                        </p>
                      </div>
                    </div>

                    {appointment.slot?.notes && (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium">Notes:</span> {appointment.slot.notes}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900">My Created Slots</h2>
            <p className="text-sm text-slate-500">All slots created by you</p>
          </div>

          <div className="divide-y divide-slate-200">
            {slots.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No slots created yet.
              </div>
            )}

            {slots.map(slot => (
              <div key={slot.id} className="p-5 transition hover:bg-slate-50/50">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Slot ID</p>
                    <p className="font-medium text-slate-900">{slot.id}</p>
                  </div>
                  <span className="h-fit rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                    {slot.type || 'N/A'}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-slate-500">Date & Time</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {formatDateTime(slot.date, slot.startTime)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Ends at {slot.endTime || 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-slate-500">Capacity</p>
                    <p className="text-slate-900 font-medium mt-1">{slot.capacity}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-slate-500">Booked Count</p>
                    <p className="text-slate-900 font-medium mt-1">{slot.bookedCount}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-slate-500">Created At</p>
                    <p className="text-slate-900 font-medium mt-1">{formatIso(slot.createdAt)}</p>
                  </div>
                </div>

                {slot.notes && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-medium">Notes:</span> {slot.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}
      </main>
    </div>
  )
}
