import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { getWeekStats, getMonthStats, getStreak } from '../src/stores/statsStore'
import { PressableScale } from '../src/components/ui'
import type { DailyStats } from '../src/types'

const screenWidth = Dimensions.get('window').width
const CHART_HEIGHT = 140

export default function StatsScreen() {
  const router = useRouter()
  const { colors, spacing, typography } = useTheme()
  const [weekData, setWeekData] = useState<DailyStats[]>([])
  const [monthData, setMonthData] = useState<DailyStats[]>([])
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [week, month, s] = await Promise.all([getWeekStats(), getMonthStats(), getStreak()])
    setWeekData(week)
    setMonthData(month)
    setStreak(s)
  }

  const weekTotal = weekData.reduce((sum, d) => sum + d.totalFocusMinutes, 0)
  const monthTotal = monthData.reduce((sum, d) => sum + d.totalFocusMinutes, 0)
  const maxWeekMin = Math.max(...weekData.map(d => d.totalFocusMinutes), 1)
  const maxMonthMin = Math.max(...monthData.map(d => d.totalFocusMinutes), 1)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const renderBar = useCallback((value: number, max: number, label: string, index: number) => {
    const height = (value / max) * CHART_HEIGHT
    return (
      <View key={index} style={styles.barCol}>
        <Text style={[styles.barValue, { color: colors.text.tertiary }]}>
          {value > 0 ? `${value}` : ''}
        </Text>
        <View style={[styles.barTrack, { backgroundColor: colors.surface.secondary }]}>
          <View style={[styles.bar, {
            height: Math.max(height, value > 0 ? 4 : 0),
            backgroundColor: colors.accent.primary,
            opacity: value / max,
          }]} />
        </View>
        <Text style={[styles.barLabel, { color: colors.text.tertiary }]}>{label}</Text>
      </View>
    )
  }, [colors])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Statistics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.streakSection, { paddingHorizontal: spacing.xl }]}>
          <View style={[styles.streakCard, { backgroundColor: colors.surface.secondary }]}>
            <Ionicons name="flame" size={32} color={colors.semantic.warning} />
            <Text style={[styles.streakValue, { color: colors.text.primary }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: colors.text.tertiary }]}>Day Streak</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: colors.surface.secondary }]}>
            <Ionicons name="time-outline" size={32} color={colors.accent.primary} />
            <Text style={[styles.streakValue, { color: colors.text.primary }]}>{weekTotal}</Text>
            <Text style={[styles.streakLabel, { color: colors.text.tertiary }]}>Min This Week</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: colors.surface.secondary }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.semantic.success} />
            <Text style={[styles.streakValue, { color: colors.text.primary }]}>{monthTotal}</Text>
            <Text style={[styles.streakLabel, { color: colors.text.tertiary }]}>Min This Month</Text>
          </View>
        </View>

        <View style={[styles.chartSection, { paddingHorizontal: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>This Week</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface.secondary }]}>
            <View style={styles.barContainer}>
              {weekData.length > 0
                ? weekData.map((d, i) => renderBar(d.totalFocusMinutes, maxWeekMin, dayLabels[i], i))
                : dayLabels.map((label, i) => renderBar(0, 1, label, i))
              }
            </View>
          </View>
        </View>

        <View style={[styles.chartSection, { paddingHorizontal: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>This Month</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.barContainer, { width: Math.max(screenWidth - 48, monthData.length * 36) }]}>
                {monthData.map((d, i) => {
                  const dayNum = d.date.split('-')[2]
                  return renderBar(d.totalFocusMinutes, maxMonthMin, `${parseInt(dayNum)}`, i)
                })}
                {monthData.length === 0 && (
                  <Text style={[styles.emptyChart, { color: colors.text.tertiary }]}>No data yet this month</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  streakSection: {
    flexDirection: 'row', gap: 12, paddingVertical: 16,
  },
  streakCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8,
  },
  streakValue: { fontSize: 28, fontWeight: '800' },
  streakLabel: { fontSize: 11, fontWeight: '500' },
  chartSection: { paddingBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  chartCard: { borderRadius: 16, padding: 16 },
  barContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: CHART_HEIGHT + 32 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 10, fontWeight: '600' },
  barTrack: { width: '100%', borderRadius: 6, flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 6, minHeight: 0 },
  barLabel: { fontSize: 10, fontWeight: '500' },
  emptyChart: { textAlign: 'center', width: '100%', paddingTop: 40 },
})
