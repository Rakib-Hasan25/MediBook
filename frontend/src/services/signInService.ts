import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { signinUser, type UserRole } from '@/lib/api'
import { setVerificationRole } from './verificationRoleStorage'

type SignInFlowResult =
  | { status: 'success'; nextRoute: '/dashboard/patient' | '/dashboard/doctor' | '/pending-approval' }
  | { status: 'verify_email' }

const VERIFICATION_PROMPT = 'Email is not verified yet. Verification email required.'
const NO_PROFILE_PROMPT = 'No account found. Please create a profile first.'

async function resolveBackendSignIn(role: UserRole): Promise<SignInFlowResult> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You are not signed in. Please try again.')
  }

  const token = await currentUser.getIdToken(true)

  try {
    const response = await signinUser(token, { role })
    return { status: 'success', nextRoute: response.nextRoute || `/dashboard/${role}` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in'

    if (message.includes(VERIFICATION_PROMPT)) {
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      })
      setVerificationRole(role)
      return { status: 'verify_email' }
    }

    if (message.includes(NO_PROFILE_PROMPT)) {
      await signOut(auth)
      throw new Error(NO_PROFILE_PROMPT)
    }

    throw error
  }
}

function mapFirebaseSignInError(error: unknown): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    if (error.code === 'auth/user-not-found') {
      return new Error(NO_PROFILE_PROMPT)
    }
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      return new Error('Invalid email or password.')
    }
  }
  return error instanceof Error ? error : new Error('Failed to sign in')
}

export async function signInByEmail(payload: {
  email: string
  password: string
  role: UserRole
}): Promise<SignInFlowResult> {
  try {
    await signInWithEmailAndPassword(auth, payload.email, payload.password)
    return await resolveBackendSignIn(payload.role)
  } catch (error) {
    throw mapFirebaseSignInError(error)
  }
}

export async function signInByGoogle(role: UserRole): Promise<SignInFlowResult> {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
  return resolveBackendSignIn(role)
}
