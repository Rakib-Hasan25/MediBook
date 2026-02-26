import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock3, LogOut, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  getVerifiedDoctorDetailsForPatient,
  type PatientDoctorDetails,
  type PatientDoctorSlot,
} from '@/services/patientDashboardService'

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

export default function PatientDoctorDetails() {
  const navigate = useNavigate()
  const { doctorId } = useParams()
  const { user, signOut } = useAuth()

  const [doctor, setDoctor] = useState<PatientDoctorDetails | null>(null)
  const [slots, setSlots] = useState<PatientDoctorSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDoctor = async () => {
    if (!doctorId) {
      setError('Doctor id is missing.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await getVerifiedDoctorDetailsForPatient(doctorId)
      setDoctor(data.doctor)
      setSlots(data.availableSlots)
    } catch (requestError) { 
      setError(requestError instanceof Error ? requestError.message : 'Failed to load doctor details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDoctor()
  }, [doctorId])

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  const handleBookAppointment = (slotId: string) => {
    if (!user?.uid) return

    const searchParams = new URLSearchParams({
      slotid: slotId,
      userid: user.uid,
      patientid: user.uid,
    })
    window.open(`${import.meta.env.VITE_PAYMENT_GATWAY_URL}/?${searchParams.toString()}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/patient')}
            className="inline-flex items-center gap-2 text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loading && <p className="text-sm text-slate-500">Loading doctor details...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && doctor && (
          <>
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {doctor.photo ? (
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-20 h-20 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <UserCircle2 className="w-12 h-12 text-slate-400" />
                  </div>
                )}

                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-slate-900">{doctor.name}</h1>
                  <p className="text-slate-600">{doctor.specialization}</p>
                  <p className="text-sm text-slate-500">Email: {doctor.email || 'Not available'}</p>
                  <p className="text-sm text-slate-500">License: {doctor.licenseNumber || 'Not available'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl">
              <div className="p-5 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Available Slots</h2>
                <p className="text-sm text-slate-500">Choose your preferred time.</p>
              </div>

              <div className="divide-y divide-slate-200">
                {slots.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">No available slots at the moment.</div>
                )}

                {slots.map(slot => (
                  <div key={slot.id} className="p-5">
                    <div className="flex flex-wrap gap-3 justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Slot ID</p>
                        <p className="font-medium text-slate-900">{slot.id}</p>
                      </div>
                      <span className="h-fit px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                        {slot.type || 'N/A'}
                      </span>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Start</p>
                        <p className="font-medium text-slate-900 mt-1 inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDateTime(slot.date, slot.startTime)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">End Time</p>
                        <p className="font-medium text-slate-900 mt-1 inline-flex items-center gap-1">
                          <Clock3 className="w-4 h-4 text-slate-400" />
                          {slot.endTime || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Capacity</p>
                        <p className="font-medium text-slate-900 mt-1">{slot.capacity}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Booked</p>
                        <p className="font-medium text-slate-900 mt-1">{slot.bookedCount}</p>
                      </div>
                    </div>

                    {slot.notes && (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium">Notes:</span> {slot.notes}
                      </p>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() => handleBookAppointment(slot.id)}
                        disabled={!user?.uid}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
