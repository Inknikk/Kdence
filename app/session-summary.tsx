import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { getSession } from '../src/stores/sessionStore'
import { Button, PressableScale } from '../src/components/ui'

import type { FocusSession } from '../src/types'

export default function SessionSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, spacing, typography } = useTheme()
  const [session, setSession] = useState<FocusSession | null>(null)

  useEffect(() => {
    if (id) getSession(id).then(setSession)
  }, [id])

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.centered}><Text style={{ color: colors.text.secondary }}>Loading...</Text></View>
      </SafeAreaView>
    )
  }

  const completedTasks = session.tasks.filter(t => t.status === 'completed')
  const totalFocusMinutes = completedTasks.reduce((sum, t) => sum + (t.actualDuration ?? t.estimatedDuration * 60), 0)
  const totalFocusMin = Math.round(totalFocusMinutes / 60)
  const completedMin = (completedTasks.length / session.tasks.length * 100).toFixed(0)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.replace('/')}>
          <Ionicons name="close-outline" size={28} color={colors.text.secondary} />
        </PressableScale>
      </View>

      <View style={[styles.hero, { paddingHorizontal: spacing.xl }]}>
        <Ionicons name="trophy-outline" size={48} color={colors.semantic.success} />
        <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
          Session Complete
        </Text>
        <Text style={[styles.heroSub, { color: colors.text.secondary }]}>
          {totalFocusMin} min focused
        </Text>
      </View>

      <View style={[styles.statsRow, { paddingHorizontal: spacing.xl }]}>
        <View style={[styles.statCard, { backgroundColor: colors.surface.secondary }]}>
          <Text style={[styles.statValue, { color: colors.accent.primary }]}>{completedTasks.length}</Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Tasks Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface.secondary }]}>
          <Text style={[styles.statValue, { color: colors.accent.primary }]}>{totalFocusMin}</Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Min Focused</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface.secondary }]}>
          <Text style={[styles.statValue, { color: colors.accent.primary }]}>{completedMin}%</Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Completion</Text>
        </View>
      </View>

      <View style={[styles.taskList, { paddingHorizontal: spacing.xl }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Tasks</Text>
        <FlatList
          data={session.tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'completed'
            const isSkipped = item.status === 'skipped'
            return (
              <View style={[styles.taskRow, { backgroundColor: colors.surface.secondary }]}>
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : isSkipped ? 'remove-circle-outline' : 'ellipse-outline'}
                  size={20}
                  color={isCompleted ? colors.semantic.success : isSkipped ? colors.text.tertiary : colors.text.secondary}
                />
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskName, { color: colors.text.primary, textDecorationLine: isSkipped ? 'line-through' : 'none' }]}>
                    {item.isBreak ? '☕ ' : ''}{item.taskName}
                  </Text>
                  <Text style={[styles.taskDuration, { color: colors.text.tertiary }]}>
                    {Math.round((item.actualDuration ?? item.estimatedDuration * 60) / 60)} min
                  </Text>
                </View>
                {item.flowStateEntered && (
                  <View style={[styles.flowBadge, { backgroundColor: colors.semantic.warning + '20' }]}>
                    <Text style={[styles.flowText, { color: colors.semantic.warning }]}>Flow</Text>
                  </View>
                )}
              </View>
            )
          }}
          style={{ flex: 1 }}
        />
      </View>

      <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        <Button title="Back to Home" onPress={() => router.replace('/')} variant="primary" size="lg" />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  heroTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  heroSub: { fontSize: 16, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12, paddingBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500' },
  taskList: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, marginBottom: 6,
  },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 14, fontWeight: '600' },
  taskDuration: { fontSize: 12, marginTop: 2 },
  flowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  flowText: { fontSize: 11, fontWeight: '700' },
  footer: { gap: 12 },
})
