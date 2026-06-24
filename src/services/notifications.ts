import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('timer', {
      name: 'Timer Events',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
    })
    await Notifications.setNotificationChannelAsync('session', {
      name: 'Session Events',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    })
  }
  return true
}

export async function scheduleTimerCompletion(durationMinutes: number): Promise<string> {
  await cancelAllScheduled()
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time Check',
      body: `Your ${durationMinutes}-minute task is up. Great work!`,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: 'timer',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationMinutes * 60,
      repeats: false,
    },
  })
  return id
}

export async function scheduleBreakComplete(durationMinutes: number): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Break Over',
      body: 'Time to get back to work!',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationMinutes * 60,
      repeats: false,
    },
  })
  return id
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}
