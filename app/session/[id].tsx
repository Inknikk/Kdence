import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, AppState } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../src/theme'
import { useTimer } from '../../src/stores/timerStore'
import { getSession, completeCurrentTask, pauseSession, resumeSession, abandonSession } from '../../src/stores/sessionStore'
import { Button, PressableScale, TaskCard } from '../../src/components/ui'
import { formatTimeDisplay } from '../../src/utils'
import type { FocusSession } from '../../src/types'

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, spacing, typography } = useTheme()
  const { state: timer, startCountdown, pause, resume, addTime, enterFlowState, stop } = useTimer()
  const [session, setSession] = useState<FocusSession | null>(null)
  const [showTransition, setShowTransition] = useState(false)

  useEffect(() => {
    loadSession()
  }, [id])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && session?.status === 'active') {
        loadSession()
      }
    })
    return () => sub.remove()
  }, [session?.status])

  async function loadSession() {
    if (!id) return
    const s = await getSession(id)
    if (!s) { router.back(); return }
    setSession(s)

    const activeTask = s.tasks.find(t => t.status === 'active')
    if (activeTask && timer.status === 'idle') {
      startCountdown(activeTask.estimatedDuration * 60)
    }
  }

  async function handleComplete() {
    if (!id) return
    stop()
    await completeCurrentTask(id)
    const s = await getSession(id)
    setSession(s)
    if (s?.status === 'completed') {
      router.replace(`/session-summary?id=${id}`)
      return
    }
    const activeTask = s?.tasks.find(t => t.status === 'active')
    if (activeTask) {
      startCountdown(activeTask.estimatedDuration * 60)
    }
    setShowTransition(false)
  }

  async function handlePauseResume() {
    if (!id) return
    if (timer.status === 'running') {
      pause()
      await pauseSession(id)
    } else {
      resume()
      await resumeSession(id)
    }
    loadSession()
  }

  async function handleExit() {
    stop()
    await abandonSession(id)
    router.back()
  }

  const activeTask = session?.tasks.find(t => t.status === 'active')
  const completedTasks = session?.tasks.filter(t => t.status === 'completed') ?? []
  const upcomingTasks = session?.tasks.filter(t => t.status === 'pending') ?? []

  if (!session || !activeTask) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.text.secondary }}>Loading session...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (showTransition) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={colors.semantic.success} />
          <Text style={[styles.transitionTitle, { color: colors.text.primary }]}>
            {activeTask.taskName}
          </Text>
          <Text style={[styles.transitionSub, { color: colors.text.secondary }]}>
            Time's up! What now?
          </Text>
          <View style={[styles.transitionOptions, { gap: spacing.md }]}>
            <Button title="Add 5 minutes" onPress={() => { addTime(300); setShowTransition(false) }} variant="secondary" size="md" style={{ width: '100%' }} />
            <Button title="Enter Flow State" onPress={() => { enterFlowState(); setShowTransition(false) }} variant="secondary" size="md" style={{ width: '100%' }} />
            <Button title="Complete & Continue" onPress={handleComplete} variant="primary" size="md" style={{ width: '100%' }} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={handleExit}>
          <Ionicons name="close-outline" size={28} color={colors.text.secondary} />
        </PressableScale>
        <Text style={[styles.headerText, { color: colors.text.tertiary }]}>
          {completedTasks.length} / {session.tasks.length} done
        </Text>
      </View>

      <View style={[styles.timerSection, { paddingHorizontal: spacing.xl }]}>
        <Text style={[styles.taskName, { color: colors.text.primary }]} numberOfLines={2}>
          {activeTask.taskName}
        </Text>

        <Text style={[styles.timer, { color: timer.isFlowState ? colors.semantic.warning : colors.accent.primary }]}>
          {timer.isFlowState
            ? `+${formatTimeDisplay(timer.elapsed)}`
            : formatTimeDisplay(timer.remaining)
          }
        </Text>

        <Text style={[styles.timerLabel, { color: colors.text.tertiary }]}>
          {timer.isFlowState ? 'Flow State' : timer.mode === 'countup' ? 'Elapsed' : 'Remaining'}
        </Text>

        <View style={[styles.timerControls, { gap: spacing.md }]}>
          <Button
            title={timer.status === 'running' ? 'Pause' : 'Resume'}
            onPress={handlePauseResume}
            variant="secondary"
            size="md"
            style={{ minWidth: 100 }}
          />
          {timer.mode === 'countdown' && !timer.isFlowState && (
            <Button title="Add 5m" onPress={() => addTime(300)} variant="ghost" size="md" />
          )}
        </View>
      </View>

      <View style={[styles.queueSection, { paddingHorizontal: spacing.xl }]}>
        <Text style={[styles.queueTitle, { color: colors.text.secondary }]}>
          Up Next
        </Text>
        <FlatList
          data={upcomingTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TaskCard
              name={item.taskName}
              duration={item.estimatedDuration}
              isBreak={item.isBreak}
              isActive={false}
              isNext={index === 0}
            />
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.text.tertiary, textAlign: 'center', paddingTop: spacing.xl }}>
              No more tasks — session will end after this task
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { fontSize: 13, fontWeight: '500' },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  taskName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueSection: {
    maxHeight: 240,
    paddingBottom: 32,
  },
  queueTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transitionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  transitionSub: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  transitionOptions: {
    width: '100%',
    maxWidth: 280,
  },
})
