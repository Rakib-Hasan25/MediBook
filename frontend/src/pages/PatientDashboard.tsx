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

  const hasActiveFilters = Boolean(search || dateFilter || specializationFilter || typeFilter)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Patient Dashboard</h1>
            <p className="text-xs text-slate-500">Browse verified doctors and choose your preferred slot</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 sm:block">
              {user?.name || 'Patient'}
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
          <p className="text-xs font-medium uppercase tracking-wider text-blue-100">Welcome back</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Find the right specialist in minutes</h2>
          <p className="mt-2 max-w-2xl text-sm text-blue-50">
            Use filters to narrow doctors by specialization, availability date, and consultation type.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Verified professionals only</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Real-time slot availability</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Simple booking flow</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Filter Doctors</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setDateFilter('')
                setSpecializationFilter('')
                setTypeFilter('')
              }}
              disabled={!hasActiveFilters}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search doctor name"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={event => setDateFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={specializationFilter}
              onChange={event => setSpecializationFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Available Doctors</h3>
            {!loading && !error && (
              <p className="text-sm text-slate-500">
                {doctors.length} doctor{doctors.length === 1 ? '' : 's'} found
              </p>
            )}
          </div>

          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
              Loading verified doctors...
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{error}</div>
          )}

          {!loading && !error && doctors.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No verified doctors match the selected filters.
            </div>
          )}

          {!loading &&
            !error &&
            doctors.map(doctor => (
              <button
                key={doctor.id}
                onClick={() => navigate(`/dashboard/patient/${doctor.uid || doctor.id}`)}
                className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {doctor.photo ? (
                    <img
                      src={doctor.photo}
                      alt={doctor.name}
                      className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                      <UserCircle2 className="h-9 w-9 text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{doctor.name}</h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {doctor.specialization}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Email: {doctor.email || 'Not available'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-center ring-1 ring-slate-100">
                      <p className="text-xs text-slate-500">Available Slots</p>
                      <p className="font-semibold text-slate-900">{doctor.availableSlotCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        Next Slot
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-900">{formatDate(doctor.nextAvailableDate)}</p>
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
