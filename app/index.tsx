import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { Button, TaskCard, PressableScale } from '../src/components/ui'
import { getAllTasks, createTask } from '../src/stores/taskStore'
import { createSession, getActiveSession } from '../src/stores/sessionStore'
import type { Task } from '../src/types'

const DEFAULT_BREAKS = [
  { name: 'Short Break', duration: 5, isBreak: true },
  { name: 'Long Break', duration: 15, isBreak: true },
]

export default function HomeScreen() {
  const { colors, spacing } = useTheme()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActiveSession, setHasActiveSession] = useState(false)

  const loadTasks = useCallback(async () => {
    try {
      const data = await getAllTasks()
      setTasks(data)
    } catch (e) {
      console.error('Failed to load tasks', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    checkActiveSession()
  }, [loadTasks])

  useFocusEffect(useCallback(() => {
    loadTasks()
    checkActiveSession()
  }, [loadTasks]))

  async function checkActiveSession() {
    const active = await getActiveSession()
    setHasActiveSession(!!active)
  }

  async function handleAddTask() {
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : 0
    const task = await createTask('New task', 25, false, maxOrder + 1)
    setTasks(prev => [...prev, task])
  }

  async function handleStartSession() {
    if (hasActiveSession) {
      const active = await getActiveSession()
      if (active) {
        router.push(`/session/${active.id}`)
      }
      return
    }
    if (tasks.length === 0) return

    const session = await createSession(
      tasks.map(t => ({
        name: t.name,
        duration: t.estimatedDuration,
        isBreak: t.isBreak,
      }))
    )
    router.push(`/session/${session.id}`)
  }

  const totalMinutes = tasks.reduce((a, t) => a + t.estimatedDuration, 0)
  const durationMinutes = Math.round(totalMinutes / 5) * 5 || 0

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text.secondary }]}>
            Ready to focus
          </Text>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Today's Stack
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <PressableScale onPress={() => router.push('/stats')}>
            <Ionicons name="stats-chart-outline" size={22} color={colors.text.secondary} />
          </PressableScale>
          <PressableScale onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
          </PressableScale>
        </View>
      </View>

      {hasActiveSession && (
        <PressableScale
          onPress={handleStartSession}
          style={[styles.activeBanner, { backgroundColor: colors.semantic.success + '20', marginHorizontal: spacing.xl, marginTop: spacing.md }]}
        >
          <Ionicons name="play-circle" size={20} color={colors.semantic.success} />
          <Text style={[styles.activeBannerText, { color: colors.semantic.success }]}>
            Resume active session
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.semantic.success} />
        </PressableScale>
      )}

      {tasks.length > 0 && (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>
            Est. {durationMinutes} min session
          </Text>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg }}
        renderItem={({ item, index }) => (
          <TaskCard
            name={item.name}
            duration={item.estimatedDuration}
            isBreak={item.isBreak}
            isActive={index === 0}
            isNext={index === 1}
          />
        )}
        refreshing={loading}
        onRefresh={loadTasks}
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.empty, { paddingTop: 80 }]}>
              <Ionicons name="list-outline" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Add tasks to start your session
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Add task" onPress={handleAddTask} variant="secondary" size="sm" />
                <Button title="Browse Library" onPress={() => router.push('/task-library')} variant="ghost" size="sm" />
              </View>
            </View>
          ) : null
        }
      />

      <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] }]}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            title="Library"
            onPress={() => router.push('/task-library')}
            variant="ghost"
            size="md"
            style={{ flex: 1 }}
          />
          <Button
            title={hasActiveSession ? 'Resume' : 'Start Session'}
            onPress={handleStartSession}
            variant="primary"
            size="md"
            style={{ flex: 2 }}
            disabled={tasks.length === 0 && !hasActiveSession}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 14,
  },
  activeBannerText: { flex: 1, fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  footer: {},
})
