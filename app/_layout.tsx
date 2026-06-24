import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ThemeProvider } from '../src/theme'
import { initDatabase } from '../src/db'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    initDatabase()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="templates" />
          <Stack.Screen name="task-library" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="premium" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
