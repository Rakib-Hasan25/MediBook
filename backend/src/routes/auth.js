import express from 'express'
import admin, { db } from '../config/firebase.js'

const router = express.Router()
const allowedRoles = new Set(['doctor', 'patient'])

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

async function getUserRecord(uid) {
  const userRef = db.collection('users').doc(uid)
  const snapshot = await userRef.get()
  return { userRef, snapshot }
}

async function getDoctorDocByUid(uid) {
  const doctorsRef = db.collection('doctors')
  const byUidSnapshot = await doctorsRef.where('uid', '==', uid).limit(1).get()

  if (!byUidSnapshot.empty) {
    const found = byUidSnapshot.docs[0]
    return {
      exists: true,
      data: found.data(),
    }
  }

  const byIdSnapshot = await doctorsRef.doc(uid).get()
  if (byIdSnapshot.exists) {
    return {
      exists: true,
      data: byIdSnapshot.data(),
    }
  }

  return {
    exists: false,
    data: null,
  }
}

router.post('/signin', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const { role } = req.body || {}
    const { snapshot } = await getUserRecord(uid)

    if (!snapshot.exists) {
      return res.status(404).json({
        message: 'No account found. Please create a profile first.',
      })
    }

    const user = snapshot.data()
    if (!allowedRoles.has(role)) {
      return res.status(400).json({
        message: 'Please select a valid role.',
      })
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: `This account is registered as ${user.role}. Please sign in as ${user.role}.`,
      })
    }

    if (user.emailStatus === 'unverified') {
      return res.status(403).json({
        message: 'Email is not verified yet. Verification email required.',
        requiresEmailVerification: true,
      })
    }

    if (user.role === 'doctor') {
      const doctorDoc = await getDoctorDocByUid(uid)
      const doctorStatus = doctorDoc.exists ? doctorDoc.data?.['doctor-status'] : null

      if (doctorStatus !== 'verified') {
        return res.status(200).json({
          message: 'Doctor profile is pending approval.',
          nextRoute: '/pending-approval',
          user,
          doctor: doctorDoc.exists ? doctorDoc.data : null,
        })
      }
    }

    return res.status(200).json({
      message: 'Sign in successful',
      nextRoute: user.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient',
      user,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to sign in', details: error.message })
  }
})

router.get('/me', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const { snapshot } = await getUserRecord(uid)

    if (!snapshot.exists) {
      return res.status(404).json({
        message: 'Profile not found. Please complete signup first.',
      })
    }

    return res.status(200).json({
      user: snapshot.data(),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile', details: error.message })
  }
})

export default router
