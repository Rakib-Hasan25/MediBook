import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Filter, LogOut, Search, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  getVerifiedDoctorsForPatient,
  type PatientDoctorCard,
  type SlotType,
} from '@/services/patientDashboardService'

function formatDate(value: string | null) {
  if (!value) return 'No upcoming slot'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PatientDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [doctors, setDoctors] = useState<PatientDoctorCard[]>([])
  const [specializationOptions, setSpecializationOptions] = useState<string[]>([])

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | SlotType>('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDoctors = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getVerifiedDoctorsForPatient({
        search,
        date: dateFilter,
        specialization: specializationFilter,
        type: typeFilter,
      })

      setDoctors(data.doctors)
      setSpecializationOptions(data.filters.specializationOptions)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDoctors()
    }, 250)

    return () => clearTimeout(timer)
  }, [search, dateFilter, specializationFilter, typeFilter])

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 font-semibold">Find Doctors</h1>
            <p className="text-xs text-slate-500">Browse verified doctors and available slots</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-slate-600">{user?.name || 'Patient'}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search doctor name"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={event => setDateFilter(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={specializationFilter}
              onChange={event => setSpecializationFilter(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              {specializationOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value as '' | SlotType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </section>

        <section className="space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading verified doctors...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && doctors.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              No verified doctors match the selected filters.
            </div>
          )}

          {!loading &&
            !error &&
            doctors.map(doctor => (
              <button
                key={doctor.id}
                onClick={() => navigate(`/dashboard/patient/${doctor.uid || doctor.id}`)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {doctor.photo ? (
                    <img
                      src={doctor.photo}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <UserCircle2 className="w-9 h-9 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">{doctor.name}</h3>
                    <p className="text-sm text-slate-600">{doctor.specialization}</p>
                    <p className="text-xs text-slate-500 mt-1">Email: {doctor.email || 'Not available'}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                    <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-xs text-slate-500">Available Slots</p>
                      <p className="font-semibold text-slate-900">{doctor.availableSlotCount}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next Slot
                      </p>
                      <p className="text-xs font-medium text-slate-900 mt-1">{formatDate(doctor.nextAvailableDate)}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </section>
      </main>
    </div>
  )
}
