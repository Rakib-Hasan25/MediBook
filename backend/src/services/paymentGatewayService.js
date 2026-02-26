import admin, { db } from '../config/firebase.js'

function normalizeString(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function normalizePositiveInt(value, fallback, min, max) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const intValue = Math.floor(parsed)
  return Math.min(Math.max(intValue, min), max)
}

function toIsoString(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

function mapUser(userId, data) {
  return {
    id: userId,
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || null,
    accountStatus: data.accountStatus || null,
  }
}

function mapSlot(slotId, data) {
  return {
    id: slotId,
    doctorId: data.doctorId || null,
    date: data.date || null,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    type: data.type || null,
    notes: data.notes || null,
    capacity: Number.isFinite(data.capacity) ? data.capacity : 0,
    bookedCount: Number.isFinite(data.bookedCount) ? data.bookedCount : 0,
    createdAt: toIsoString(data.createdAt),
  }
}

function mapDoctor(doctorId, data) {
  return {
    id: doctorId,
    uid: data.uid || doctorId,
    name: data.name || 'Doctor',
    email: data.email || null,
    specialization: data.specialization || null,
    profileImage: data.profile_image || null,
    licenseNumber: data.license_number || null,
    status: data['doctor-status'] || null,
  }
}

async function getUserById(userId) {
  const snapshot = await db.collection('users').doc(userId).get()
  if (!snapshot.exists) throw new Error('User not found')
  return snapshot.data() || {}
}

async function getSlotById(slotId) {
  const snapshot = await db.collection('slots').doc(slotId).get()
  if (!snapshot.exists) throw new Error('Slot not found')
  return snapshot.data() || {}
}

async function getDoctorByIdOrUid(doctorId) {
  const byId = await db.collection('doctors').doc(doctorId).get()
  if (byId.exists) {
    return {
      id: byId.id,
      data: byId.data() || {},
    }
  }

  const byUid = await db.collection('doctors').where('uid', '==', doctorId).limit(1).get()
  if (!byUid.empty) {
    const doc = byUid.docs[0]
    return {
      id: doc.id,
      data: doc.data() || {},
    }
  }

  throw new Error('Doctor not found')
}

function getSlotIdFromInput(input) {
  return normalizeString(input?.slotId || input?.slotid)
}

function getUserIdFromInput(input) {
  return normalizeString(input?.userId || input?.userid || input?.patientId || input?.patientid)
}

export async function getPaymentGatewaySession(input) {
  const slotId = getSlotIdFromInput(input)
  const userId = getUserIdFromInput(input)

  if (!slotId || !userId) {
    throw new Error('slotid and userid are required')
  }

  const [userData, slotData] = await Promise.all([getUserById(userId), getSlotById(slotId)])
  if (!slotData.doctorId) throw new Error('Slot has no doctorId')

  const doctor = await getDoctorByIdOrUid(slotData.doctorId)

  return {
    user: mapUser(userId, userData),
    slot: mapSlot(slotId, slotData),
    doctor: mapDoctor(doctor.id, doctor.data),
  }
}

export async function initiatePayment(input) {
  const slotId = getSlotIdFromInput(input)
  const userId = getUserIdFromInput(input)

  if (!slotId || !userId) {
    throw new Error('slotid and userid are required')
  }

  const user = await getUserById(userId)
  const appointmentRef = db.collection('appointments').doc()
  const paymentRef = db.collection('payments').doc()
  const transactionId = `TXN_${Date.now()}`
  const amount = 500
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
  let doctorIdFromSlot = null

  await db.runTransaction(async transaction => {
    const slotRef = db.collection('slots').doc(slotId)
    const slotDoc = await transaction.get(slotRef)

    if (!slotDoc.exists) {
      throw new Error('Slot not found')
    }

    const slot = slotDoc.data() || {}
    const bookedCount = Number.isFinite(slot.bookedCount) ? slot.bookedCount : 0
    const capacity = Number.isFinite(slot.capacity) ? slot.capacity : 0

    if (bookedCount >= capacity) {
      throw new Error('Slot already booked')
    }

    if (!slot.doctorId) {
      throw new Error('Slot has no doctorId')
    }
    doctorIdFromSlot = slot.doctorId

    transaction.update(slotRef, {
      bookedCount: bookedCount + 1,
    })

    transaction.set(appointmentRef, {
      slotId,
      doctorId: slot.doctorId,
      patientId: userId,
      status: 'pending_payment',
      paymentId: paymentRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    })

    transaction.set(paymentRef, {
      appointmentId: appointmentRef.id,
      transactionId,
      amount,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

  return {
    appointment: {
      id: appointmentRef.id,
      slotId,
      doctorId: doctorIdFromSlot,
      patientId: userId,
      status: 'pending_payment',
      paymentId: paymentRef.id,
      expiresAt: expiresAt.toDate().toISOString(),
    },
    payment: {
      id: paymentRef.id,
      appointmentId: appointmentRef.id,
      transactionId,
      amount,
      status: 'pending',
    },
    user: mapUser(userId, user),
  }
}

export async function listPayments(input) {
  const slotId = getSlotIdFromInput(input)
  const userId = getUserIdFromInput(input)
  const limit = normalizePositiveInt(input?.limit, 30, 1, 100)

  const snapshot = await db.collection('payments').orderBy('createdAt', 'desc').limit(limit).get()
  const payments = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }))

  const appointmentIds = Array.from(new Set(payments.map(item => item.appointmentId).filter(Boolean)))
  const appointmentMap = new Map()

  await Promise.all(
    appointmentIds.map(async appointmentId => {
      const appointmentSnapshot = await db.collection('appointments').doc(appointmentId).get()
      if (appointmentSnapshot.exists) {
        appointmentMap.set(appointmentId, appointmentSnapshot.data() || {})
      }
    }),
  )

  const rows = payments
    .map(item => {
      const appointment = item.appointmentId ? appointmentMap.get(item.appointmentId) || null : null
      return {
        id: item.id,
        transactionId: item.transactionId || null,
        amount: Number.isFinite(item.amount) ? item.amount : 0,
        status: item.status || 'pending',
        createdAt: toIsoString(item.createdAt),
        appointment: appointment
          ? {
              id: item.appointmentId,
              slotId: appointment.slotId || null,
              patientId: appointment.patientId || null,
              doctorId: appointment.doctorId || null,
              status: appointment.status || null,
              paymentId: appointment.paymentId || null,
              expiresAt: toIsoString(appointment.expiresAt),
            }
          : null,
      }
    })
    .filter(item => {
      if (slotId && item.appointment?.slotId !== slotId) return false
      if (userId && item.appointment?.patientId !== userId) return false
      return true
    })

  return {
    payments: rows,
    total: rows.length,
  }
}
