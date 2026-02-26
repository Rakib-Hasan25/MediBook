import express from 'express'
import admin from '../config/firebase.js'
import { createDoctorSlot, listDoctorAppointments, listDoctorSlots } from '../services/doctorDashboardService.js'

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

router.post('/slots', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const slot = await createDoctorSlot(uid, req.body)
    return res.status(201).json({
      message: 'Slot created successfully',
      slot,
    })
  } catch (error) {
    if (error.message?.includes('required') || error.message?.includes('Invalid') || error.message?.includes('must be')) {
      return res.status(400).json({ message: error.message })
    }
    if (error.message === 'Doctor profile not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({
      message: 'Failed to create slot',
      details: error.message,
    })
  }
})

router.get('/slots', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const response = await listDoctorSlots(uid)
    return res.status(200).json(response)
  } catch (error) {
    if (error.message === 'Doctor profile not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({
      message: 'Failed to fetch doctor slots',
      details: error.message,
    })
  }
})

router.get('/appointments', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.auth
    const response = await listDoctorAppointments(uid, req.query || {})
    return res.status(200).json(response)
  } catch (error) {
    if (error.message?.includes('Invalid')) {
      return res.status(400).json({ message: error.message })
    }
    if (error.message === 'Doctor profile not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({
      message: 'Failed to fetch doctor appointments',
      details: error.message,
    })
  }
})

export default router
