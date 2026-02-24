import express from 'express'
import Busboy from 'busboy'
import path from 'path'
import { randomUUID } from 'crypto'
import { bucket } from '../config/firebase.js'

const router = express.Router()
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024
router.post('/upload', (req, res) => {

  const busboy = Busboy({
    headers: req.headers,
    limits: { files: 1, fileSize: MAX_FILE_SIZE },
  })

  let fileHandled = false
  let uploadPromise = null
  let sizeLimitHit = false

  busboy.on('file', (_fieldName, file, info) => {
    fileHandled = true
    const { filename, mimeType } = info

    if (!ALLOWED_TYPES.has(mimeType)) {
      file.resume()
      uploadPromise = Promise.reject(new Error('Only image files are allowed'))
      return
    }

    const ext = path.extname(filename || '') || '.jpg'
    const destFileName = `uploads/${randomUUID()}${ext}`
    const storageFile = bucket.file(destFileName)
    const writeStream = storageFile.createWriteStream({
      metadata: {
        contentType: mimeType,
        metadata: { firebaseStorageDownloadTokens: randomUUID() },
      },
      resumable: false,
    })

    uploadPromise = new Promise((resolve, reject) => {
      file.on('limit', () => {
        sizeLimitHit = true
        writeStream.destroy(new Error('File too large'))
      })
      file.on('error', reject)
      writeStream.on('error', reject)
      writeStream.on('finish', async () => {
        try {
          await storageFile.makePublic()
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destFileName}`
          resolve(publicUrl)
        } catch (error) {
          reject(error)
        }
      })
    })

    file.pipe(writeStream)
  })

  busboy.on('finish', async () => {
    try {
      if (!fileHandled || !uploadPromise) {
        return res.status(400).json({ error: 'No image file provided' })
      }
      if (sizeLimitHit) {
        return res.status(400).json({ error: 'Image must be 10MB or less' })
      }

      const url = await uploadPromise
      return res.status(200).json({ url })
    } catch (error) {
      console.error('Firebase upload error:', error)
      const message = error instanceof Error ? error.message : 'Failed to upload image'
      return res.status(500).json({ error: message })
    }
  })

  busboy.on('error', error => {
    console.error('Busboy parsing error:', error)
    return res.status(500).json({ error: 'Failed to process upload request' })
  })

  req.pipe(busboy)
})

export default router