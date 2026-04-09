'use client'

import { useEffect, useState } from 'react'
import { JWTPayload } from './jwt'

export function useSession() {
  const [session, setSession] = useState<JWTPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setSession(d.usuario ?? null))
      .catch(() => setSession(null))
      .finally(() => setLoading(false))
  }, [])

  return { session, loading }
}