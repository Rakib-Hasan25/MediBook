import {
  GoogleAuthProvider,
  applyActionCode,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  markPatientEmailVerified,
  registerPatientWithEmail,
  registerPatientWithGoogle,
  type AppUser,
} from '@/lib/api'
import { clearVerificationRole, setVerificationRole } from './verificationRoleStorage'

async function getFreshIdToken() {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You are not signed in. Please sign up again.')
  }
  return currentUser.getIdToken(true)
}




export async function registerPatientByEmail(payload: {
  name: string
  email: string
  password: string
}): Promise<AppUser> {
  const credentials = await createUserWithEmailAndPassword(auth, payload.email, payload.password)
  await updateProfile(credentials.user, { displayName: payload.name })

  const token = await credentials.user.getIdToken()
  const { user } = await registerPatientWithEmail(token, { name: payload.name })

  await sendEmailVerification(credentials.user, {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: true,
  })

  setVerificationRole('patient')
  return user
}

export async function registerPatientByGoogle(): Promise<AppUser> {
  const provider = new GoogleAuthProvider()
  const credentials = await signInWithPopup(auth, provider)
  const token = await credentials.user.getIdToken()
  const name = credentials.user.displayName || 'Patient'
  const { user } = await registerPatientWithGoogle(token, { name })
  clearVerificationRole()
  return user
}

export async function completePatientEmailVerification(oobCode: string): Promise<AppUser> {
  await applyActionCode(auth, oobCode)
  const token = await getFreshIdToken()
  const { user } = await markPatientEmailVerified(token)
  return user
}

export async function syncPatientEmailVerificationFromSession(): Promise<AppUser | null> {
  const currentUser = auth.currentUser
  if (!currentUser) return null

  await currentUser.reload()
  if (!currentUser.emailVerified) return null

  const token = await currentUser.getIdToken(true)
  const { user } = await markPatientEmailVerified(token)
  clearVerificationRole()
  return user
}
