import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ThemeProvider } from '../src/theme'
import { initDatabase } from '../src/db'
import { requestNotificationPermission } from '../src/services/notifications'
import { captureEvent, AnalyticsEvents } from '../src/services/analytics'
import { configureRevenueCat } from '../src/services/subscriptions'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    initDatabase()
    requestNotificationPermission()
    configureRevenueCat()
    captureEvent(AnalyticsEvents.APP_OPENED)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="session-summary" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="templates" />
          <Stack.Screen name="create-template" />
          <Stack.Screen name="task-library" />
          <Stack.Screen name="edit-task" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="account" />
          <Stack.Screen name="paywall" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
