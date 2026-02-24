import admin from 'firebase-admin'

import dotenv from 'dotenv'

dotenv.config()
//added if (!admin.apps.length) guard to avoid duplicate init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

export const db = admin.firestore()
export const bucket = admin.storage().bucket()
export default admin