import express from 'express'
import admin from '../config/firebase.js'
import {
  getVerifiedDoctorDetailsForPatient,
  listVerifiedDoctorsForPatient,
} from '../services/patientDashboardService.js'

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

router.get('/doctors', verifyAuth, async (req, res) => {
  try {
    const response = await listVerifiedDoctorsForPatient(req.query || {})
    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch doctors',
      details: error.message,
    })
  }
})

router.get('/doctors/:doctorId', verifyAuth, async (req, res) => {
  try {
    const response = await getVerifiedDoctorDetailsForPatient(req.params.doctorId)
    return res.status(200).json(response)
  } catch (error) {
    if (error.message === 'Doctor not found') {
      return res.status(404).json({ message: error.message })
    }
    if (error.message === 'Doctor profile is not verified') {
      return res.status(403).json({ message: error.message })
    }
    return res.status(500).json({
      message: 'Failed to fetch doctor details',
      details: error.message,
    })
  }
})

export default router
