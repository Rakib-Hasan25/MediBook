/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  getCurrentUser,
  signinUser,
  signupUser,
  type AppUser,
  type UserRole,
} from '@/lib/api'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  signUp: (payload: {
    name: string
    email: string
    password: string
    role: UserRole
  }) => Promise<AppUser>
  signIn: (payload: { email: string; password: string; role: UserRole }) => Promise<AppUser>
  refreshProfile: () => Promise<AppUser | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async (): Promise<AppUser | null> => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      setUser(null)
      return null
    }

    const token = await currentUser.getIdToken(true)
    const { user: backendUser } = await getCurrentUser(token)
    setUser(backendUser)
    return backendUser
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const token = await currentUser.getIdToken()
        const { user: backendUser } = await getCurrentUser(token)
        setUser(backendUser)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const signUp = async ({
    name,
    email,
    password,
    role,
  }: {
    name: string
    email: string
    password: string
    role: UserRole
  }) => {
    const credentials = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credentials.user, { displayName: name })
    const token = await credentials.user.getIdToken()
    const { user: backendUser } = await signupUser(token, { name, role })
    setUser(backendUser)
    return backendUser
  }

  const signIn = async ({
    email,
    password,
    role,
  }: {
    email: string
    password: string
    role: UserRole
  }) => {
    const credentials = await signInWithEmailAndPassword(auth, email, password)
    const token = await credentials.user.getIdToken()
    const { user: backendUser } = await signinUser(token, { role })
    setUser(backendUser)
    return backendUser
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, refreshProfile, signOut }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
