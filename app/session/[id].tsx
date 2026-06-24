import { useEffect, useState, useRef } from 'react'
import { View, Text, FlatList, StyleSheet, AppState } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../src/theme'
import { useTimer } from '../../src/stores/timerStore'
import { getSession, completeCurrentTask, pauseSession, resumeSession, abandonSession } from '../../src/stores/sessionStore'
import { Button, PressableScale, TaskCard } from '../../src/components/ui'
import { formatTimeDisplay } from '../../src/utils'
import { scheduleTimerCompletion, cancelAllScheduled, requestNotificationPermission } from '../../src/services/notifications'
import { impactMedium, notificationSuccess } from '../../src/services/haptics'
import { shouldAutoBreak, getRecommendedBreak } from '../../src/services/autoBreak'
import type { FocusSession } from '../../src/types'

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, spacing } = useTheme()
  const { state: timer, startCountdown, startCountup, pause, resume, addTime, enterFlowState, stop } = useTimer()
  const [session, setSession] = useState<FocusSession | null>(null)
  const [showTransition, setShowTransition] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState('')
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [notifGranted, setNotifGranted] = useState(false)
  const timerRef = useRef<{ pause: () => void; resume: () => void; stop: () => void }>({ pause: () => {}, resume: () => {}, stop: () => {} })
  timerRef.current = { pause, resume, stop }

  useEffect(() => {
    requestNotificationPermission().then(setNotifGranted)
  }, [])

  useEffect(() => {
    loadSession()
    return () => { cancelAllScheduled() }
  }, [id])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && session?.status === 'active') loadSession()
    })
    return () => sub.remove()
  }, [session?.status])

  async function loadSession() {
    if (!id) return
    const s = await getSession(id)
    if (!s) { router.back(); return }
    setSession(s)

    const activeTask = s.tasks.find(t => t.status === 'active')
    const isBreak = activeTask?.isBreak ?? false
    setIsBreakTime(isBreak)

    if (activeTask && timer.status === 'idle') {
      startCountdown(activeTask.estimatedDuration * 60)
      if (notifGranted) {
        scheduleTimerCompletion(activeTask.estimatedDuration)
      }
    }
  }

  async function handleComplete() {
    if (!id) return
    stop()
    impactMedium()
    notificationSuccess()
    await cancelAllScheduled()
    await completeCurrentTask(id)
    const s = await getSession(id)
    setSession(s)

    if (s?.status === 'completed') {
      router.replace(`/session-summary?id=${id}`)
      return
    }

    const activeTask = s?.tasks.find(t => t.status === 'active')
    if (activeTask) {
      setIsBreakTime(activeTask.isBreak)
      setTransitionMessage(activeTask.isBreak ? 'Take a breather' : `Next up: ${activeTask.taskName}`)
      setTimeout(() => {
        startCountdown(activeTask.estimatedDuration * 60)
        if (notifGranted) scheduleTimerCompletion(activeTask.estimatedDuration)
        setShowTransition(false)
      }, 1000)
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
      setShowTransition(false)
      await resumeSession(id)
    }
    loadSession()
  }

  async function handleExit() {
    stop()
    await cancelAllScheduled()
    await abandonSession(id)
    router.back()
  }

  function handleTransition(action: 'add5' | 'flow' | 'complete') {
    if (action === 'add5') {
      addTime(300)
      if (notifGranted) {
        const remaining = timer.remaining + 300
        scheduleTimerCompletion(Math.ceil(remaining / 60))
      }
    } else if (action === 'flow') {
      enterFlowState()
    } else {
      handleComplete()
    }
    setShowTransition(false)
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
          <Ionicons
            name={isBreakTime ? 'cafe' : 'checkmark-circle'}
            size={64}
            color={isBreakTime ? colors.semantic.warning : colors.semantic.success}
          />
          <Text style={[styles.transitionTitle, { color: colors.text.primary }]}>
            {transitionMessage}
          </Text>
          <Text style={[styles.transitionSub, { color: colors.text.secondary }]}>
            {isBreakTime ? 'Your break is ready' : 'Time to move forward'}
          </Text>
          <View style={[styles.transitionOptions, { gap: spacing.md }]}>
            <Button title="Add 5 minutes" onPress={() => handleTransition('add5')} variant="secondary" size="md" style={{ width: '100%' }} />
            <Button title="Enter Flow State" onPress={() => handleTransition('flow')} variant="secondary" size="md" style={{ width: '100%' }} />
            <Button title="Continue" onPress={() => handleTransition('complete')} variant="primary" size="md" style={{ width: '100%' }} />
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
        {isBreakTime && (
          <View style={[styles.breakBadge, { backgroundColor: colors.semantic.warning + '20' }]}>
            <Ionicons name="cafe" size={14} color={colors.semantic.warning} />
            <Text style={[styles.breakText, { color: colors.semantic.warning }]}>Break</Text>
          </View>
        )}
        <Text style={[styles.headerText, { color: colors.text.tertiary }]}>
          {completedTasks.length}/{session.tasks.length}
        </Text>
      </View>

      <View style={[styles.timerSection, { paddingHorizontal: spacing.xl }]}>
        <Text style={[styles.taskName, { color: colors.text.primary }]} numberOfLines={2}>
          {isBreakTime ? '☕ Break Time' : activeTask.taskName}
        </Text>

        <Text style={[styles.timer, {
          color: timer.isFlowState
            ? colors.semantic.warning
            : isBreakTime
              ? colors.semantic.warning
              : colors.accent.primary
        }]}>
          {timer.isFlowState
            ? `+${formatTimeDisplay(timer.elapsed)}`
            : formatTimeDisplay(timer.remaining)
          }
        </Text>

        <Text style={[styles.timerLabel, { color: colors.text.tertiary }]}>
          {timer.isFlowState ? 'Flow State' : isBreakTime ? 'Break remaining' : 'Remaining'}
        </Text>

        <View style={[styles.timerControls, { gap: spacing.md }]}>
          <Button
            title={timer.status === 'running' ? 'Pause' : 'Resume'}
            onPress={handlePauseResume}
            variant="secondary"
            size="md"
            style={{ minWidth: 100 }}
          />
          {timer.mode === 'countdown' && !timer.isFlowState && !isBreakTime && (
            <Button title="+5m" onPress={() => { addTime(300); handleTransition('add5') }} variant="ghost" size="md" />
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
              name={item.isBreak ? '☕ ' + item.taskName : item.taskName}
              duration={item.estimatedDuration}
              isBreak={item.isBreak}
              isActive={false}
              isNext={index === 0}
            />
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: spacing.xl, alignItems: 'center', gap: 8 }}>
              <Ionicons name="flag-outline" size={24} color={colors.text.tertiary} />
              <Text style={{ color: colors.text.tertiary, textAlign: 'center' }}>
                Last task in session
              </Text>
            </View>
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
    paddingBottom: 8,
  },
  headerText: { fontSize: 13, fontWeight: '500' },
  breakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  breakText: { fontSize: 12, fontWeight: '700' },
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
