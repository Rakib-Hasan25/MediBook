import { db } from '../config/firebase.js'

function normalizeString(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function toIsoString(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

function isSlotAvailable(slot, now) {
  const bookedCount = Number.isFinite(slot?.bookedCount) ? slot.bookedCount : 0
  const capacity = Number.isFinite(slot?.capacity) ? slot.capacity : 0
  if (capacity <= 0 || bookedCount >= capacity) return false

  if (!slot?.date || !slot?.endTime) return false
  const endDate = new Date(`${slot.date}T${slot.endTime}:00`)
  if (Number.isNaN(endDate.getTime())) return false
  return endDate.getTime() >= now.getTime()
}

function mapDoctorCard(id, doctor, slotSummary) {
  return {
    id,
    uid: doctor.uid || id,
    name: doctor.name || 'Doctor',
    photo: doctor.profile_image || null,
    specialization: doctor.specialization || 'General',
    email: doctor.email || null,
    licenseNumber: doctor.license_number || null,
    status: doctor['doctor-status'] || null,
    availableSlotCount: slotSummary.availableCount,
    nextAvailableDate: slotSummary.nextDate,
  }
}

function mapSlot(slotDoc) {
  const data = slotDoc.data()
  return {
    id: slotDoc.id,
    doctorId: data.doctorId || null,
    date: data.date || null,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    capacity: Number.isFinite(data.capacity) ? data.capacity : 1,
    bookedCount: Number.isFinite(data.bookedCount) ? data.bookedCount : 0,
    type: data.type || null,
    notes: data.notes || null,
    createdAt: toIsoString(data.createdAt),
  }
}

async function getVerifiedDoctors() {
  const snapshot = await db.collection('doctors').where('doctor-status', '==', 'verified').limit(300).get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function buildSlotIndex(doctorIds) {
  const uniqueDoctorIds = Array.from(new Set(doctorIds.filter(Boolean)))
  const slotIndex = new Map()

  for (const doctorId of uniqueDoctorIds) {
    const snapshot = await db.collection('slots').where('doctorId', '==', doctorId).limit(500).get()
    const slots = snapshot.docs.map(mapSlot)
    slotIndex.set(doctorId, slots)
  }

  return slotIndex
}

export async function listVerifiedDoctorsForPatient(filters) {
  const search = normalizeString(filters?.search).toLowerCase()
  const specializationFilter = normalizeString(filters?.specialization).toLowerCase()
  const dateFilter = normalizeString(filters?.date)
  const typeFilter = normalizeString(filters?.type).toLowerCase()

  const doctors = await getVerifiedDoctors()
  const doctorIds = doctors.flatMap(doctor => [doctor.id, doctor.uid])
  const slotIndex = await buildSlotIndex(doctorIds)
  const now = new Date()

  const filtered = doctors
    .map(doctor => {
      const slotsByDocId = slotIndex.get(doctor.id) || []
      const slotsByUid = doctor.uid ? slotIndex.get(doctor.uid) || [] : []
      const mergedSlotsMap = new Map()
      ;[...slotsByDocId, ...slotsByUid].forEach(slot => mergedSlotsMap.set(slot.id, slot))
      const slots = Array.from(mergedSlotsMap.values())
      const availableSlots = slots.filter(slot => isSlotAvailable(slot, now))
      const nextDate = availableSlots
        .map(slot => `${slot.date || ''}T${slot.startTime || '00:00'}:00`)
        .filter(Boolean)
        .sort()[0] || null

      return {
        doctor,
        card: mapDoctorCard(doctor.id, doctor, {
          availableCount: availableSlots.length,
          nextDate,
        }),
        availableSlots,
      }
    })
    .filter(({ doctor, card, availableSlots }) => {
      if (search && !card.name.toLowerCase().includes(search)) return false
      if (specializationFilter && !card.specialization.toLowerCase().includes(specializationFilter)) return false
      if (dateFilter && !availableSlots.some(slot => slot.date === dateFilter)) return false
      if (typeFilter && !availableSlots.some(slot => (slot.type || '').toLowerCase() === typeFilter)) return false
      if (doctor['doctor-status'] !== 'verified') return false
      return true
    })
    .sort((a, b) => a.card.name.localeCompare(b.card.name))

  const specializationOptions = Array.from(
    new Set(doctors.map(item => normalizeString(item.specialization)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))

  return {
    doctors: filtered.map(item => item.card),
    filters: {
      specializationOptions,
      typeOptions: ['online', 'offline'],
    },
  }
}

export async function getVerifiedDoctorDetailsForPatient(doctorId) {
  const byUidSnapshot = await db.collection('doctors').where('uid', '==', doctorId).limit(1).get()
  if (byUidSnapshot.empty) throw new Error('Doctor not found')
  const doc = byUidSnapshot.docs[0]

  const doctor = doc.data()
  if (doctor['doctor-status'] !== 'verified') {
    throw new Error('Doctor profile is not verified')
  }
  // console.log(doctor)
  // console.log(doc.id)
  const now = new Date()
  const slotSnapshot = await db.collection('slots').where('doctorId', '==', doc.id).limit(500).get()

  
  const availableSlots = slotSnapshot.docs
    .map(mapSlot)
    // .filter(slot => isSlotAvailable(slot, now))
  //   .sort((a, b) => {
  //     const first = new Date(`${a.date || ''}T${a.startTime || '00:00'}:00`).getTime()
  //     const second = new Date(`${b.date || ''}T${b.startTime || '00:00'}:00`).getTime()
  //     return first - second
  //   }
  // )

  console.log(availableSlots)

  return {
    doctor: {
      id: doc.id,
      uid: doctor.uid || doc.id,
      name: doctor.name || 'Doctor',
      photo: doctor.profile_image || null,
      specialization: doctor.specialization || 'General',
      email: doctor.email || null,
      licenseNumber: doctor.license_number || null,
      status: doctor['doctor-status'] || null,
      documentUrl: doctor.document_url || null,
    },
    availableSlots,
  }
}
