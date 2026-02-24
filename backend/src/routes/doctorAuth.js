import express from 'express'
import admin, { db } from '../config/firebase.js'

const router = express.Router()

function getBearerToken(req) {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim()
}

async function verifyAuth(req, res, next) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).json({ message: 'Missing bearer token' })
    }

    const decoded = await admin.auth().verifyIdToken(token)
    req.auth = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', details: error.message })
  }
}

async function upsertDoctorProfile({
  uid,
  email,
  name,
  emailStatus,
}) {
  const userRef = db.collection('users').doc(uid)
  const snapshot = await userRef.get()
  const now = new Date().toISOString()

  const existingData = snapshot.exists ? snapshot.data() : null
  const cleanedName = name?.trim() || existingData?.name || 'Doctor'

  const doctorData = {
    uid,
    email,
    name: cleanedName,
    role: 'doctor',
    emailStatus,
    accountStatus: emailStatus === 'verified' ? 'active' : 'pending_verification',
    updatedAt: now,
  }

  if (!snapshot.exists) {
    doctorData.createdAt = now
  }

  await userRef.set(doctorData, { merge: true })
  const updatedSnapshot = await userRef.get()


  
  return updatedSnapshot.data()
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function getDoctorDocByUid(uid) {
  const doctorsRef = db.collection('doctors')
  const byUidSnapshot = await doctorsRef.where('uid', '==', uid).limit(1).get()

  if (!byUidSnapshot.empty) {
    const found = byUidSnapshot.docs[0]
    return {
      exists: true,
      ref: found.ref,
      data: found.data(),
    }
  }

  const byIdRef = doctorsRef.doc(uid)
  const byIdSnapshot = await byIdRef.get()
  if (byIdSnapshot.exists) {
    return {
      exists: true,
      ref: byIdRef,
      data: byIdSnapshot.data(),
    }
  }

  return {
    exists: false,
    ref: byIdRef,
    data: null,
  }
}

router.post('/register-email', verifyAuth, async (req, res) => {
  try {
    const { uid, email } = req.auth
    const { name } = req.body || {}

    const user = await upsertDoctorProfile({
      uid,
      email,
      name,
      emailStatus: 'unverified',
    })

    return res.status(201).json({
      message: 'Doctor profile created with unverified email',
      user,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create doctor profile',
      details: error.message,
    })
  }
})

router.post('/register-google', verifyAuth, async (req, res) => {
  try {
    const { uid, email } = req.auth
    const { name } = req.body || {}

    const user = await upsertDoctorProfile({
      uid,
      email,
      name,
      emailStatus: 'verified',
    })

    return res.status(201).json({
      message: 'Doctor profile created for Google account',
      user,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create Google doctor profile',
      details: error.message,
    })
  }
})

router.patch('/email-verified', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const userRef = db.collection('users').doc(uid)
    const snapshot = await userRef.get()

    if (!snapshot.exists) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }

    const userData = snapshot.data()
    if (userData.role !== 'doctor') {
      return res.status(400).json({ message: 'Only doctor email can be updated here' })
    }

    const now = new Date().toISOString()
    await userRef.set(
      {
        emailStatus: 'verified',
        accountStatus: 'active',
        updatedAt: now,
      },
      { merge: true },
    )

    const updatedSnapshot = await userRef.get()
    return res.status(200).json({
      message: 'Doctor email verified successfully',
      user: updatedSnapshot.data(),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update email verification status',
      details: error.message,
    })
  }
})

router.get('/pending-profile', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const userRef = db.collection('users').doc(uid)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }

    const userData = userSnapshot.data()
    if (userData.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this endpoint' })
    }

    const doctorDoc = await getDoctorDocByUid(uid)
    return res.status(200).json({
      exists: doctorDoc.exists,
      doctor: doctorDoc.exists ? doctorDoc.data : null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch doctor pending profile',
      details: error.message,
    })
  }
})

router.post('/pending-profile', verifyAuth, async (req, res) => {
  try {
    const { uid, email: authEmail } = req.auth
    const userRef = db.collection('users').doc(uid)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }

    const userData = userSnapshot.data()
    if (userData.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can submit this profile' })
    }

    const { profile_image, license_number, document_url, specialization } = req.body || {}
    const doctorDoc = await getDoctorDocByUid(uid)
    const now = new Date().toISOString()

    const doctorPayload = {
      uid,
      name: userData.name || 'Doctor',
      email: userData.email || authEmail || null,
      profile_image: normalizeOptionalString(profile_image),
      license_number: normalizeOptionalString(license_number),
      document_url: normalizeOptionalString(document_url),
      specialization: normalizeOptionalString(specialization),
      'doctor-status': doctorDoc.data?.['doctor-status'] === 'verified' ? 'verified' : 'pending',
      updatedAt: now,
    }

    if (!doctorDoc.exists) {
      doctorPayload.createdAt = now
    }

    await doctorDoc.ref.set(doctorPayload, { merge: true })
    const updatedSnapshot = await doctorDoc.ref.get()

    return res.status(201).json({
      message: 'Doctor pending profile saved successfully',
      doctor: updatedSnapshot.data(),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save doctor pending profile',
      details: error.message,
    })
  }
})

export default router
