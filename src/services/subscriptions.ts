import { Platform } from 'react-native'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import AsyncStorage from '@react-native-async-storage/async-storage'

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || ''

const ENTITLEMENT_ID = 'premium'
const CACHE_KEY = '@kdence:premium_status'

export async function configureRevenueCat(userId?: string): Promise<void> {
  if (!RC_API_KEY) return

  Purchases.setLogLevel(LOG_LEVEL.WARN)

  if (Platform.OS === 'ios') {
    await Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId })
  } else {
    await Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId })
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    if (cached === 'true') return true

    if (!RC_API_KEY) return false

    const customerInfo = await Purchases.getCustomerInfo()
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined

    if (isPremium) {
      await AsyncStorage.setItem(CACHE_KEY, 'true')
    }

    return isPremium
  } catch {
    return false
  }
}

export async function getOfferings() {
  if (!RC_API_KEY) return null
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current
  } catch {
    return null
  }
}

export async function purchasePackage(pack: any): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack)
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
    if (isPremium) {
      await AsyncStorage.setItem(CACHE_KEY, 'true')
    }
    return isPremium
  } catch {
    return false
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases()
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
    if (isPremium) {
      await AsyncStorage.setItem(CACHE_KEY, 'true')
    }
    return isPremium
  } catch {
    return false
  }
}

export async function clearPremiumCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY)
}
