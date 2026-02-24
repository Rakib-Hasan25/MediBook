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

async function upsertPatientProfile({
  uid,
  email,
  name,
  emailStatus,
}) {
  const userRef = db.collection('users').doc(uid)
  const snapshot = await userRef.get()
  const now = new Date().toISOString()

  const existingData = snapshot.exists ? snapshot.data() : null
  const cleanedName = name?.trim() || existingData?.name || 'Patient'

  const patientData = {
    uid,
    email,
    name: cleanedName,
    role: 'patient',
    emailStatus,
    accountStatus: emailStatus === 'verified' ? 'active' : 'pending_verification',
    updatedAt: now,
  }

  if (!snapshot.exists) {
    patientData.createdAt = now
  }

  await userRef.set(patientData, { merge: true })
  const updatedSnapshot = await userRef.get()
  return updatedSnapshot.data()
}

router.post('/register-email', verifyAuth, async (req, res) => {
  try {
    const { uid, email } = req.auth
    const { name } = req.body || {}

    const user = await upsertPatientProfile({
      uid,
      email,
      name,
      emailStatus: 'unverified',
    })

    return res.status(201).json({
      message: 'Patient profile created with unverified email',
      user,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create patient profile',
      details: error.message,
    })
  }
})



router.post('/register-google', verifyAuth, async (req, res) => {
  try {
    const { uid, email } = req.auth
    const { name } = req.body || {}

    const user = await upsertPatientProfile({
      uid,
      email,
      name,
      emailStatus: 'verified',
    })

    return res.status(201).json({
      message: 'Patient profile created for Google account',
      user,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create Google patient profile',
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
      return res.status(404).json({ message: 'Patient profile not found' })
    }

    const userData = snapshot.data()
    if (userData.role !== 'patient') {
      return res.status(400).json({ message: 'Only patient email can be updated here' })
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
      message: 'Patient email verified successfully',
      user: updatedSnapshot.data(),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update email verification status',
      details: error.message,
    })
  }
})

export default router
