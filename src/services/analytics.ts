import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || ''
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const DISTINCT_ID_KEY = '@kdence:analytics_id'

let enabled = !!API_KEY

interface EventProps {
  [key: string]: string | number | boolean | undefined
}

function getPlatform(): string {
  return Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'
}

async function getDistinctId(): Promise<string> {
  let id = await AsyncStorage.getItem(DISTINCT_ID_KEY)
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await AsyncStorage.setItem(DISTINCT_ID_KEY, id)
  }
  return id
}

export async function captureEvent(event: string, properties?: EventProps): Promise<void> {
  if (!enabled) return

  try {
    const distinctId = await getDistinctId()
    const body = {
      api_key: API_KEY,
      event,
      distinct_id: distinctId,
      properties: {
        $os: getPlatform(),
        $app_version: '1.4.0',
        ...properties,
        timestamp: new Date().toISOString(),
      },
    }

    fetch(`${HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  } catch {}
}

export async function identifyUser(userId: string, properties?: EventProps): Promise<void> {
  if (!enabled) return

  try {
    const body = {
      api_key: API_KEY,
      event: '$identify',
      distinct_id: userId,
      properties: {
        $set: { ...properties, platform: getPlatform() },
        timestamp: new Date().toISOString(),
      },
    }

    fetch(`${HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  } catch {}
}

export const AnalyticsEvents = {
  SESSION_STARTED: 'session_started',
  TASK_COMPLETED: 'task_completed',
  SESSION_COMPLETED: 'session_completed',
  FLOW_STATE_ENTERED: 'flow_state_entered',
  TEMPLATE_CREATED: 'template_created',
  PREMIUM_PURCHASED: 'premium_purchased',
  APP_OPENED: 'app_opened',
  SYNC_TRIGGERED: 'sync_triggered',
} as const
