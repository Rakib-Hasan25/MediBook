import express from 'express'
import {
  getPaymentGatewaySession,
  initiatePayment,
  listPayments,
} from '../services/paymentGatewayService.js'

const router = express.Router()

router.get('/session', async (req, res) => {
  try {
    const session = await getPaymentGatewaySession(req.query || {})
    return res.status(200).json({ session })
  } catch (error) {
    if (
      error.message === 'slotid and userid are required' ||
      error.message === 'Slot has no doctorId'
    ) {
      return res.status(400).json({ message: error.message })
    }

    if (
      error.message === 'User not found' ||
      error.message === 'Slot not found' ||
      error.message === 'Doctor not found'
    ) {
      return res.status(404).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Failed to fetch payment gateway session',
      details: error.message,
    })
  }
})

router.post('/initiate', async (req, res) => {
  try {
    const response = await initiatePayment(req.body || {})
    return res.status(201).json(response)
  } catch (error) {
    if (
      error.message === 'slotid and userid are required' ||
      error.message === 'Slot has no doctorId' ||
      error.message === 'Slot already booked'
    ) {
      return res.status(400).json({ message: error.message })
    }

    if (error.message === 'User not found' || error.message === 'Slot not found') {
      return res.status(404).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Failed to initiate payment',
      details: error.message,
    })
  }
})

router.get('/payments', async (req, res) => {
  try {
    const response = await listPayments(req.query || {})
    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch payments',
      details: error.message,
    })
  }
})

export default router
