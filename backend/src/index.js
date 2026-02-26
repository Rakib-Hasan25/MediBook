import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRouter from './routes/auth.js'
import patientAuthRouter from './routes/patientAuth.js'
import doctorAuthRouter from './routes/doctorAuth.js'
import uploadRouter from './routes/upload.js'
import doctorDashboardRouter from './routes/doctorDashboard.js'
import patientDashboardRouter from './routes/patientDashboard.js'
import paymentGatewayRouter from './routes/paymentGateway.js'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())


app.get('/', (_, res) => {
  res.send("Root is working")
})


app.use('/auth', authRouter)
app.use('/auth/patients', patientAuthRouter)
app.use('/auth/doctors', doctorAuthRouter)
app.use('/uploads', uploadRouter)
app.use('/doctor-dashboard', doctorDashboardRouter)
app.use('/patient-dashboard', patientDashboardRouter)
app.use('/payment-gateway', paymentGatewayRouter)



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})