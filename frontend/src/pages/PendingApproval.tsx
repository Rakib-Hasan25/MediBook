import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Clock3, FileText, LogOut, ShieldCheck, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchDoctorPendingProfile,
  saveDoctorPendingProfile,
  uploadDoctorImage,
  type DoctorPendingRecord,
} from '@/services/doctorPendingService'

const EMPTY_FORM = {
  profile_image: '',
  license_number: '',
  document_url: '',
  specialization: '',
}

export default function PendingApproval() {
  const { user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [doctorDoc, setDoctorDoc] = useState<DoctorPendingRecord | null>(null)
  const [docExists, setDocExists] = useState<boolean | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [documentImageFile, setDocumentImageFile] = useState<File | null>(null)

  const userName = useMemo(() => user?.name || 'Doctor', [user?.name])
  const userEmail = useMemo(() => user?.email || 'Not available', [user?.email])

  const loadDoctorRecord = async () => {
    if (!user?.uid) {
      setLoading(false)
      setDocExists(false)
      return
    }

    try {
      const response = await fetchDoctorPendingProfile()
      const foundDoc = response.doctor

      if (foundDoc && foundDoc['doctor-status'] === 'verified') {
        navigate('/dashboard/doctor')
        return
      }

      setDoctorDoc(foundDoc)
      setDocExists(response.exists)
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to load doctor details'
      setMessage(text)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorRecord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  useEffect(() => {
    if (!doctorDoc) return
    setFormData({
      profile_image: doctorDoc.profile_image || '',
      license_number: doctorDoc.license_number || '',
      document_url: doctorDoc.document_url || '',
      specialization: doctorDoc.specialization || '',
    })
    setProfileImageFile(null)
    setDocumentImageFile(null)
  }, [doctorDoc])

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  const handleCheckStatus = async () => {
    setLoading(true)
    setMessage('')
    try {
      await loadDoctorRecord()
      const currentUser = await refreshProfile()
      if (currentUser?.role === 'doctor' && currentUser.accountStatus === 'active') {
        navigate('/dashboard/doctor')
        return
      }
      setMessage('Still pending verification. Please check again later.')
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to refresh account'
      setMessage(text)
    }
  }

  const handleInputChange = (field: keyof typeof EMPTY_FORM, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateDoctorDetails = async () => {
    if (!user?.uid) {
      setMessage('User session not found. Please sign in again.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const hasExistingDoc = Boolean(docExists && doctorDoc)
      let profileImageUrl = hasExistingDoc ? doctorDoc?.profile_image || null : null
      let documentImageUrl = hasExistingDoc ? doctorDoc?.document_url || null : null

      if (profileImageFile || documentImageFile) {
        setMessage('Uploading images...')
      }
      if (profileImageFile) {
        profileImageUrl = await uploadDoctorImage(profileImageFile)
      }
      if (documentImageFile) {
        documentImageUrl = await uploadDoctorImage(documentImageFile)
      }

      if (!hasExistingDoc && (!profileImageUrl || !documentImageUrl)) {
        setMessage('Please upload both profile image and document image.')
        return
      }

      setMessage('Saving doctor details...')
      const response = await saveDoctorPendingProfile({
        profile_image: profileImageUrl,
        license_number: formData.license_number,
        document_url: documentImageUrl,
        specialization: formData.specialization,
      })

      setDoctorDoc(response.doctor)
      setDocExists(true)
      setMessage(response.message || 'Doctor details saved successfully. Awaiting verification.')
    } catch (error) {
      const text =
        error instanceof Error ? error.message : 'Failed to submit doctor details'
      setMessage(text)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-slate-900 text-2xl font-bold">MediBook</span>
          </div>
          <p className="text-slate-600 text-sm">Loading your doctor verification details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-3xl bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-slate-900 text-2xl font-bold">MediBook</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Doctor Name</div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <UserCircle className="w-4 h-4 text-slate-500" />
              {userName}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Email</div>
            <div className="text-slate-800 font-semibold break-all">{userEmail}</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Doctor verification pending</h1>
        <p className="text-slate-500 mb-6">
          Hi {userName}, your account is created but awaiting admin approval.
          You can access your doctor profile right after verification.
        </p>

        <div className="mt-6 p-4 rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 text-sm flex gap-2">
          <Clock3 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Status: Pending verification (doctor-status not verified)</span>
        </div>

        {docExists && doctorDoc && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h2 className="text-slate-900 font-semibold">Doctor details submitted</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-slate-500 text-xs mb-1">Profile Image URL</div>
                <div className="text-slate-800 break-all">{doctorDoc.profile_image || 'null'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-slate-500 text-xs mb-1">License Number</div>
                <div className="text-slate-800">{doctorDoc.license_number || 'null'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-slate-500 text-xs mb-1">Document URL</div>
                <div className="text-slate-800 break-all">{doctorDoc.document_url || 'null'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-slate-500 text-xs mb-1">Specialization</div>
                <div className="text-slate-800">{doctorDoc.specialization || 'null'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-slate-900 font-semibold">
              {docExists ? 'Update doctor details' : 'Complete doctor details'}
            </h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            {docExists
              ? 'You can update your submitted details and upload new images if needed.'
              : 'No doctor document was found for your account. Please submit your details for review.'}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700">
              <span className="block mb-2 font-medium">Profile Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => setProfileImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="mt-1 block text-xs text-slate-500">
                {profileImageFile
                  ? profileImageFile.name
                  : doctorDoc?.profile_image
                    ? 'Keeping existing profile image'
                    : 'No file selected'}
              </span>
            </label>
            <label className="text-sm text-slate-700">
              <span className="block mb-2 font-medium">License Number</span>
              <input
                type="text"
                value={formData.license_number}
                onChange={e => handleInputChange('license_number', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. MED-123456"
              />
            </label>
            <label className="text-sm text-slate-700 sm:col-span-2">
              <span className="block mb-2 font-medium">Document Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => setDocumentImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="mt-1 block text-xs text-slate-500">
                {documentImageFile
                  ? documentImageFile.name
                  : doctorDoc?.document_url
                    ? 'Keeping existing document image'
                    : 'No file selected'}
              </span>
            </label>
            <label className="text-sm text-slate-700 sm:col-span-2">
              <span className="block mb-2 font-medium">Specialization</span>
              <input
                type="text"
                value={formData.specialization}
                onChange={e => handleInputChange('specialization', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. Cardiology"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleCreateDoctorDetails}
            disabled={submitting}
            className="mt-5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-70 cursor-pointer"
          >
            {submitting
              ? 'Submitting details...'
              : docExists
                ? 'Update doctor details'
                : 'Submit doctor details'}
          </button>
        </div>

        {message && (
          <div className="mt-4 text-sm rounded-xl px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700">
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={loading || submitting}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-70 cursor-pointer"
          >
            {loading ? 'Checking...' : 'Check verification status'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
