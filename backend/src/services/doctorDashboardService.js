import admin, { db } from '../config/firebase.js'

const APPOINTMENT_STATUSES = new Set(['pending_payment', 'confirmed', 'failed', 'expired'])
const SLOT_TYPES = new Set(['online', 'offline'])

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

function toSlotEndDate(slot) {
  if (!slot?.date || !slot?.endTime) return null
  const date = new Date(`${slot.date}T${slot.endTime}:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isCurrentAppointment(appointment, slot, now) {
  if (appointment.status === 'failed' || appointment.status === 'expired') {
    return false
  }

  const slotEndDate = toSlotEndDate(slot)
  if (slotEndDate) {
    return slotEndDate.getTime() >= now.getTime()
  }

  if (appointment.expiresAt && typeof appointment.expiresAt.toDate === 'function') {
    return appointment.expiresAt.toDate().getTime() >= now.getTime()
  }

  return true
}

export async function getDoctorByUid(uid) {
  const byUidSnapshot = await db.collection('doctors').where('uid', '==', uid).limit(1).get()
  if (!byUidSnapshot.empty) {
    const doc = byUidSnapshot.docs[0]
    return {
      exists: true,
      id: doc.id,
      data: doc.data(),
    }
  }

  const byIdRef = db.collection('doctors').doc(uid)
  const byIdSnapshot = await byIdRef.get()
  if (byIdSnapshot.exists) {
    return {
      exists: true,
      id: byIdSnapshot.id,
      data: byIdSnapshot.data(),
    }
  }

  return {
    exists: false,
    id: uid,
    data: null,
  }
}

export async function createDoctorSlot(uid, payload) {
  const doctor = await getDoctorByUid(uid)
  if (!doctor.exists) {
    throw new Error('Doctor profile not found')
  }

  const date = normalizeString(payload?.date)
  const startTime = normalizeString(payload?.startTime)
  const endTime = normalizeString(payload?.endTime)
  const type = normalizeString(payload?.type).toLowerCase()
  const notes = normalizeString(payload?.notes)
  const capacity = Number(payload?.capacity)

  if (!date || !startTime || !endTime) {
    throw new Error('date, startTime and endTime are required')
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error('capacity must be an integer and at least 1')
  }

  if (!SLOT_TYPES.has(type)) {
    throw new Error('type must be online or offline')
  }

  const start = new Date(`${date}T${startTime}:00`)
  const end = new Date(`${date}T${endTime}:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date/time format')
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error('endTime must be after startTime')
  }

  const slotPayload = {
    doctorId: uid,
    date,
    startTime,
    endTime,
    capacity,
    type,
    notes: notes || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    bookedCount: 0,
  }

  const ref = await db.collection('slots').add(slotPayload)
  const created = await ref.get()

  return {
    id: ref.id,
    ...created.data(),
    createdAt: toIsoString(created.data()?.createdAt),
  }
}

export async function listDoctorSlots(uid) {
  const doctor = await getDoctorByUid(uid)
  if (!doctor.exists) {
    throw new Error('Doctor profile not found')
  }

  const doctorIds = Array.from(new Set([uid, doctor.id]))
  const slotMap = new Map()

  for (const doctorId of doctorIds) {
    const snapshot = await db.collection('slots').where('doctorId', '==', doctorId).limit(500).get()
    snapshot.forEach(doc => {
      slotMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      })
    })
  }

  const slots = Array.from(slotMap.values())
    .map(slot => ({
      id: slot.id,
      doctorId: slot.doctorId || uid,
      date: slot.date || null,
      startTime: slot.startTime || null,
      endTime: slot.endTime || null,
      capacity: Number.isFinite(slot.capacity) ? slot.capacity : 1,
      type: slot.type || null,
      notes: slot.notes || null,
      bookedCount: Number.isFinite(slot.bookedCount) ? slot.bookedCount : 0,
      createdAt: toIsoString(slot.createdAt),
    }))
    .sort((a, b) => {
      const first = a.date ? new Date(`${a.date}T${a.startTime || '00:00'}:00`).getTime() : 0
      const second = b.date ? new Date(`${b.date}T${b.startTime || '00:00'}:00`).getTime() : 0
      return second - first
    })

  return {
    slots,
    total: slots.length,
  }
}

export async function listDoctorAppointments(uid, query) {
  const doctor = await getDoctorByUid(uid)
  if (!doctor.exists) {
    throw new Error('Doctor profile not found')
  }

  const status = normalizeString(query?.status)
  const timeframe = normalizeString(query?.timeframe) || 'all'
  const limit = Math.min(Math.max(Number(query?.limit) || 100, 1), 200)

  if (status && status !== 'all' && !APPOINTMENT_STATUSES.has(status)) {
    throw new Error('Invalid appointment status filter')
  }
  if (!new Set(['all', 'current', 'previous']).has(timeframe)) {
    throw new Error('Invalid timeframe filter')
  }

  const doctorIds = Array.from(new Set([uid, doctor.id]))
  const appointmentMap = new Map()

  for (const doctorId of doctorIds) {
    let ref = db.collection('appointments').where('doctorId', '==', doctorId)
    if (status && status !== 'all') {
      ref = ref.where('status', '==', status)
    }

    const snapshot = await ref.limit(limit).get()
    snapshot.forEach(doc => {
      appointmentMap.set(doc.id, { id: doc.id, ...doc.data() })
    })
  }

  const appointments = Array.from(appointmentMap.values())
  const slotIds = Array.from(new Set(appointments.map(item => item.slotId).filter(Boolean)))
  const slotMap = new Map()

  await Promise.all(
    slotIds.map(async slotId => {
      const slotSnapshot = await db.collection('slots').doc(slotId).get()
      if (slotSnapshot.exists) {
        slotMap.set(slotId, slotSnapshot.data())
      }
    }),
  )

  const now = new Date()
  const enriched = appointments.map(appointment => {
    const slot = appointment.slotId ? slotMap.get(appointment.slotId) || null : null
    const isCurrent = isCurrentAppointment(appointment, slot, now)

    return {
      id: appointment.id,
      slotId: appointment.slotId || null,
      doctorId: appointment.doctorId || uid,
      patientId: appointment.patientId || null,
      status: appointment.status || 'pending_payment',
      paymentId: appointment.paymentId || null,
      createdAt: toIsoString(appointment.createdAt),
      expiresAt: toIsoString(appointment.expiresAt),
      slot: slot
        ? {
            date: slot.date || null,
            startTime: slot.startTime || null,
            endTime: slot.endTime || null,
            type: slot.type || null,
            notes: slot.notes || null,
          }
        : null,
      isCurrent,
    }
  })

  const sorted = enriched.sort((a, b) => {
    const first = a.slot?.date ? new Date(`${a.slot.date}T${a.slot.endTime || '23:59'}:00`).getTime() : 0
    const second = b.slot?.date ? new Date(`${b.slot.date}T${b.slot.endTime || '23:59'}:00`).getTime() : 0
    return second - first
  })

  const filtered = sorted.filter(item => {
    if (timeframe === 'current') return item.isCurrent
    if (timeframe === 'previous') return !item.isCurrent
    return true
  })

  return {
    doctor: {
      id: doctor.id,
      uid,
      ...doctor.data,
    },
    appointments: filtered,
    counts: {
      total: sorted.length,
      current: sorted.filter(item => item.isCurrent).length,
      previous: sorted.filter(item => !item.isCurrent).length,
    },
  }
}
