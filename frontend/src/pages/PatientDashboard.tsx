import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  LogOut,
  Calendar,
  Heart,
  Pill,
  MessageSquare,
  Clock,
  ChevronRight,
  Star,
  CheckCircle,
  Search,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePosts } from '@/hooks/usePosts'

const upcomingAppointments = [
  {
    id: 1,
    doctor: 'Dr. Sarah Williams',
    specialty: 'Cardiologist',
    date: 'Feb 24, 2026',
    time: '10:00 AM',
    type: 'In-Person',
    avatar: 'SW',
  },
  {
    id: 2,
    doctor: 'Dr. Mark Thompson',
    specialty: 'General Physician',
    date: 'Mar 2, 2026',
    time: '03:30 PM',
    type: 'Video Call',
    avatar: 'MT',
  },
]

const prescriptions = [
  { name: 'Lisinopril 10mg', frequency: 'Once daily', refills: 2, status: 'active' },
  { name: 'Metformin 500mg', frequency: 'Twice daily', refills: 1, status: 'active' },
  { name: 'Atorvastatin 20mg', frequency: 'Once at night', refills: 0, status: 'refill-needed' },
]

const myDoctors = [
  { name: 'Dr. Sarah Williams', specialty: 'Cardiologist', rating: 4.9, avatar: 'SW', color: 'from-rose-400 to-rose-600' },
  { name: 'Dr. Mark Thompson', specialty: 'General Physician', rating: 4.7, avatar: 'MT', color: 'from-blue-400 to-blue-600' },
  { name: 'Dr. Lisa Chen', specialty: 'Dermatologist', rating: 4.8, avatar: 'LC', color: 'from-violet-400 to-violet-600' },
]

const healthMetrics = [
  { label: 'Blood Pressure', value: '120/80', status: 'Normal' },
  { label: 'Heart Rate', value: '72 bpm', status: 'Normal' },
  { label: 'Blood Sugar', value: '95 mg/dL', status: 'Normal' },
  { label: 'BMI', value: '22.5', status: 'Healthy' },
]

export default function PatientDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { posts, loading, error } = usePosts() 

  const handleSignOut = () => {
    signOut()
    navigate('/signin')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Navigation ── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 text-lg font-bold">MediBook</span>
            <span className="hidden sm:block text-slate-200 mx-1">|</span>
            <span className="hidden sm:block text-slate-400 text-sm">Patient Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() ?? 'P'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
                <div className="text-xs text-slate-400">Patient</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Welcome Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Hello, {user?.name}! 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">How are you feeling today? Here's your health overview.</p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Upcoming Visits',
              value: '2',
              sub: 'Next: Feb 24',
              icon: Calendar,
              iconBg: 'bg-teal-100',
              iconColor: 'text-teal-600',
              subColor: 'text-teal-600',
            },
            {
              label: 'Total Visits',
              value: '15',
              sub: '+2 this year',
              icon: CheckCircle,
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600',
              subColor: 'text-blue-600',
            },
            {
              label: 'Prescriptions',
              value: '3',
              sub: '1 needs refill',
              icon: Pill,
              iconBg: 'bg-violet-100',
              iconColor: 'text-violet-600',
              subColor: 'text-red-500',
            },
            {
              label: 'Messages',
              value: '1',
              sub: 'From Dr. Williams',
              icon: MessageSquare,
              iconBg: 'bg-amber-100',
              iconColor: 'text-amber-600',
              subColor: 'text-amber-600',
            },
          ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, subColor }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
              <div className="text-xs text-slate-500 mb-1.5">{label}</div>
              <div className={`text-xs font-medium ${subColor}`}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900">Upcoming Appointments</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your scheduled visits</p>
                </div>
                <button className="flex items-center gap-1 text-teal-600 text-sm font-medium hover:underline cursor-pointer">
                  Book new <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {upcomingAppointments.map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {appt.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{appt.doctor}</div>
                      <div className="text-xs text-slate-500">{appt.specialty}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" /> {appt.date}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" /> {appt.time}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                        appt.type === 'Video Call'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {appt.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Prescriptions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900">Active Prescriptions</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your current medications</p>
                </div>
                <button className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {prescriptions.map(rx => (
                  <div key={rx.name} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        rx.status === 'refill-needed' ? 'bg-red-50' : 'bg-violet-50'
                      }`}
                    >
                      <Pill className={`w-5 h-5 ${rx.status === 'refill-needed' ? 'text-red-500' : 'text-violet-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{rx.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {rx.frequency} · {rx.refills} refill{rx.refills !== 1 ? 's' : ''} left
                      </div>
                    </div>
                    {rx.status === 'refill-needed' ? (
                      <button className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition cursor-pointer flex-shrink-0">
                        Request Refill
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Find a Doctor */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Find a Doctor</h2>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by doctor name or specialty..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedic', 'Pediatrician'].map(spec => (
                  <button
                    key={spec}
                    className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 px-3 py-1.5 rounded-full transition cursor-pointer"
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Health Summary */}
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Heart className="w-5 h-5" />
                <h2 className="font-bold">Health Summary</h2>
              </div>
              <div className="space-y-2.5">
                {healthMetrics.map(({ label, value, status }) => (
                  <div key={label} className="flex items-center justify-between bg-white/15 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-teal-100 text-xs">{label}</div>
                      <div className="text-white font-semibold text-sm mt-0.5">{value}</div>
                    </div>
                    <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Doctors */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">My Doctors</h2>
                <button className="text-teal-600 text-xs font-medium hover:underline cursor-pointer">View all</button>
              </div>
              <div className="space-y-4">
                {myDoctors.map(doc => (
                  <div key={doc.name} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${doc.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                    >
                      {doc.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{doc.name}</div>
                      <div className="text-xs text-slate-400">{doc.specialty}</div>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-500 flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {doc.rating}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 border border-dashed border-slate-200 rounded-xl text-sm text-teal-600 font-medium hover:bg-teal-50 hover:border-teal-300 transition cursor-pointer">
                + Find a new doctor
              </button>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-1.5">
                {[
                  { label: 'Book Appointment', color: 'bg-teal-50 text-teal-600', icon: Calendar },
                  { label: 'View Medical Records', color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
                  { label: 'Message a Doctor', color: 'bg-amber-50 text-amber-600', icon: MessageSquare },
                ].map(({ label, color, icon: Icon }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1 text-left">
                      {label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4">Medical Posts</h2>

        {loading && <p className="text-slate-400 text-sm">Loading posts...</p>}

        {error && (
          <p className="text-red-500 text-sm">
            Access Denied: {error}
          </p>
        )}

        {!loading && !error && posts.map(post => (
          <div key={post.id} className="mb-4 p-4 border border-slate-100 rounded-xl">
            <h3 className="font-semibold text-slate-800">{post.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{post.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
