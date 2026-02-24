import admin from 'firebase-admin'

import dotenv from 'dotenv'

//for using require in module mode we can use this approach 

import { createRequire } from 'module'

dotenv.config()

const require = createRequire(import.meta.url)
const serviceAccount = require('../../service-account.json')


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
})

export const db = admin.firestore()
export const bucket = admin.storage().bucket()
export default admin