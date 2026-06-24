import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { checkPremiumStatus } from './subscriptions'

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkPremiumStatus().then(status => {
      setIsPremium(status)
      setLoading(false)
    })
  }, [])

  const requirePremium = useCallback(() => {
    if (!isPremium) {
      router.push('/paywall')
      return false
    }
    return true
  }, [isPremium, router])

  return { isPremium, loading, requirePremium }
}
