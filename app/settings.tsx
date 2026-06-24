import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { Button, PressableScale } from '../src/components/ui'
import { clearTasks } from '../src/stores'
import { getDatabase } from '../src/db'

export default function SettingsScreen() {
  const router = useRouter()
  const { colors, spacing } = useTheme()

  const db = getDatabase()

  function handleClearAll() {
    Alert.alert('Clear All Data', 'This will remove all tasks, sessions, and stats. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Everything', style: 'destructive',
        onPress: async () => {
          await db.withTransactionAsync(async () => {
            await db.runAsync('DELETE FROM tasks')
            await db.runAsync('DELETE FROM sessions')
            await db.runAsync('DELETE FROM session_tasks')
            await db.runAsync('DELETE FROM templates')
            await db.runAsync('DELETE FROM daily_stats')
          })
          router.back()
        }
      }
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: 12 }}>
        <View style={[styles.section, { backgroundColor: colors.surface.secondary }]}>
          <PressableScale style={styles.row}>
            <Ionicons name="moon-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Dark Mode</Text>
            <View style={[styles.badge, { backgroundColor: colors.accent.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.accent.primary }]}>Always On</Text>
            </View>
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.bg.primary }]} />
          <PressableScale style={styles.row}>
            <Ionicons name="timer-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Default Timer</Text>
            <Text style={[styles.rowValue, { color: colors.text.tertiary }]}>25 min</Text>
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.bg.primary }]} />
          <PressableScale style={styles.row}>
            <Ionicons name="beer-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Auto-Breaks</Text>
            <Text style={[styles.rowValue, { color: colors.text.tertiary }]}>On</Text>
          </PressableScale>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>DATA</Text>
        <View style={[styles.section, { backgroundColor: colors.surface.secondary }]}>
          <PressableScale onPress={() => router.push('/templates')} style={styles.row}>
            <Ionicons name="layers-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Templates</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.bg.primary }]} />
          <PressableScale onPress={() => router.push('/stats')} style={styles.row}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Statistics</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </PressableScale>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>ACCOUNT</Text>
        <View style={[styles.section, { backgroundColor: colors.surface.secondary }]}>
          <PressableScale onPress={() => router.push('/account')} style={styles.row}>
            <Ionicons name="cloud-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Cloud Sync & Account</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </PressableScale>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.surface.secondary }]}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.text.tertiary }]}>1.4.0</Text>
          </View>
        </View>

        <Button
          title="Clear All Data"
          onPress={handleClearAll}
          variant="secondary"
          size="md"
          style={{ marginTop: 24 }}
        />
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
  section: { borderRadius: 14, overflow: 'hidden' },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, paddingTop: 8, paddingBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14 },
  divider: { height: 1, marginLeft: 48 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
})
