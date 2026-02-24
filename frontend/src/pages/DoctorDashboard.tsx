import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  LogOut,
  Calendar,
  Users,
  Star,
  CheckCircle,
  Clock,
  ChevronRight,
  User,
  Phone,
  FileText,
  Stethoscope,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePosts } from '@/hooks/usePosts'
const appointments = [
  { id: 1, patient: 'Sarah Johnson', age: 32, time: '09:00 AM', type: 'General Checkup', status: 'completed', avatar: 'SJ' },
  { id: 2, patient: 'Mike Chen', age: 45, time: '10:30 AM', type: 'Blood Pressure Review', status: 'in-progress', avatar: 'MC' },
  { id: 3, patient: 'Emma Davis', age: 28, time: '11:00 AM', type: 'Post-Surgery Follow-up', status: 'completed', avatar: 'ED' },
  { id: 4, patient: 'James Wilson', age: 56, time: '02:00 PM', type: 'Diabetes Consultation', status: 'upcoming', avatar: 'JW' },
  { id: 5, patient: 'Lisa Brown', age: 40, time: '03:30 PM', type: 'Routine Checkup', status: 'upcoming', avatar: 'LB' },
]

const recentPatients = [
  { name: 'Robert Park', condition: 'Hypertension', lastVisit: '2 days ago', avatar: 'RP' },
  { name: 'Alice Morgan', condition: 'Diabetes Type 2', lastVisit: '5 days ago', avatar: 'AM' },
  { name: 'David Lee', condition: 'Asthma', lastVisit: '1 week ago', avatar: 'DL' },
  { name: 'Grace Kim', condition: 'Migraine', lastVisit: '2 weeks ago', avatar: 'GK' },
]

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Upcoming' },
  'in-progress': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
}

const avatarColors = [
  'from-blue-400 to-blue-600',
  'from-violet-400 to-violet-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-teal-400 to-teal-600',
]

export default function DoctorDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { posts, loading, error } = usePosts()   
  const handleSignOut = () => {
    signOut()
    navigate('/signin')
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Navigation ── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 text-lg font-bold">MediBook</span>
            <span className="hidden sm:block text-slate-200 mx-1">|</span>
            <span className="hidden sm:block text-slate-400 text-sm">Doctor Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() ?? 'D'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-tight">Dr. {user?.name}</div>
                <div className="text-xs text-slate-400">General Physician</div>
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
          <h1 className="text-2xl font-bold text-slate-900">
            Good morning, Dr. {user?.name} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{today}</p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Patients',
              value: '248',
              sub: '+12 this month',
              icon: Users,
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600',
              subColor: 'text-blue-600',
            },
            {
              label: "Today's Appointments",
              value: '12',
              sub: '3 remaining',
              icon: Calendar,
              iconBg: 'bg-violet-100',
              iconColor: 'text-violet-600',
              subColor: 'text-violet-600',
            },
            {
              label: 'Completed Today',
              value: '7',
              sub: 'Out of 12',
              icon: CheckCircle,
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600',
              subColor: 'text-green-600',
            },
            {
              label: 'Average Rating',
              value: '4.9★',
              sub: 'Based on 318 reviews',
              icon: Star,
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
          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Today's Schedule</h2>
                <p className="text-xs text-slate-400 mt-0.5">{appointments.length} appointments</p>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {appointments.map((appt, i) => {
                const cfg = statusConfig[appt.status]
                return (
                  <div key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${avatarColors[i % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                    >
                      {appt.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">{appt.patient}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {appt.type} · Age {appt.age}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.time}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-1.5">
                {[
                  { icon: Calendar, label: 'New Appointment', color: 'bg-blue-50 text-blue-600' },
                  { icon: User, label: 'Add Patient', color: 'bg-green-50 text-green-600' },
                  { icon: FileText, label: 'Write Prescription', color: 'bg-violet-50 text-violet-600' },
                  { icon: Phone, label: 'Video Consultation', color: 'bg-amber-50 text-amber-600' },
                  { icon: Stethoscope, label: 'Patient Records', color: 'bg-rose-50 text-rose-600' },
                ].map(({ icon: Icon, label, color }) => (
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

            {/* Recent Patients */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Recent Patients</h2>
                <button className="text-blue-600 text-xs font-medium hover:underline cursor-pointer">View all</button>
              </div>
              <div className="space-y-3">
                {recentPatients.map((patient, i) => (
                  <div key={patient.name} className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 bg-gradient-to-br ${avatarColors[(i + 2) % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                    >
                      {patient.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{patient.name}</div>
                      <div className="text-xs text-slate-400 truncate">{patient.condition}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{patient.lastVisit}</div>
                  </div>
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
