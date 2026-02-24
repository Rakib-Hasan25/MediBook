import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  markDoctorEmailVerified,
  registerDoctorWithEmail,
  registerDoctorWithGoogle,
  type AppUser,
} from '@/lib/api'
import { clearVerificationRole, setVerificationRole } from './verificationRoleStorage'

export async function registerDoctorByEmail(payload: {
  name: string
  email: string
  password: string
}): Promise<AppUser> {
  const credentials = await createUserWithEmailAndPassword(auth, payload.email, payload.password)
  await updateProfile(credentials.user, { displayName: payload.name })

  const token = await credentials.user.getIdToken()
  const { user } = await registerDoctorWithEmail(token, { name: payload.name })

  await sendEmailVerification(credentials.user, {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: true,
  })

  setVerificationRole('doctor')
  return user
}

export async function registerDoctorByGoogle(): Promise<AppUser> {
  const provider = new GoogleAuthProvider()
  const credentials = await signInWithPopup(auth, provider)
  const token = await credentials.user.getIdToken()
  const name = credentials.user.displayName || 'Doctor'
  const { user } = await registerDoctorWithGoogle(token, { name })

  clearVerificationRole()
  return user
}

export async function syncDoctorEmailVerificationFromSession(): Promise<AppUser | null> {
  const currentUser = auth.currentUser
  if (!currentUser) return null

  await currentUser.reload()
  if (!currentUser.emailVerified) return null

  const token = await currentUser.getIdToken(true)
  const { user } = await markDoctorEmailVerified(token)
  clearVerificationRole()
  return user
}
