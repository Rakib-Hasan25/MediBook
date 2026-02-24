import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

type Post = {
  id: string
  title: string
  description: string
  createdAt: string
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Force token refresh to ensure custom claims are present
        await auth.currentUser?.getIdToken(true)

        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, 'id'>),
        }))

        setPosts(data)
      } catch (err: any) {
        // PERMISSION_DENIED = patient or unverified doctor trying to access
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return { posts, loading, error }
}