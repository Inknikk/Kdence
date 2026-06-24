import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { getAllTemplates, deleteTemplate } from '../src/stores'
import { Button, PressableScale } from '../src/components/ui'
import { usePremium } from '../src/services/premiumGate'
import { checkPremiumStatus } from '../src/services/subscriptions'
import type { Template as FocusTemplate } from '../src/types'

const TEMPLATE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Deep Work': 'code-slash',
  'Study': 'school',
  'Writing': 'create',
  'Reading': 'book',
  'Exercise': 'fitness',
  'Meditation': 'leaf',
  'Creative': 'color-palette',
  'Meeting': 'people',
}

export default function TemplatesScreen() {
  const router = useRouter()
  const { colors, spacing } = useTheme()
  const { isPremium } = usePremium()
  const [templates, setTemplates] = useState<FocusTemplate[]>([])

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const result = await getAllTemplates()
    setTemplates(result)
  }

  async function handleDelete(id: string) {
    await deleteTemplate(id)
    loadTemplates()
  }

  function getIcon(name: string): keyof typeof Ionicons.glyphMap {
    for (const [key, icon] of Object.entries(TEMPLATE_ICONS)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return icon
    }
    return 'layers-outline'
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Templates</Text>
        <PressableScale onPress={() => {
          if (!isPremium) { router.push('/paywall'); return }
          router.push('/create-template')
        }}>
          <Ionicons name="add" size={24} color={isPremium ? colors.accent.primary : colors.text.tertiary} />
        </PressableScale>
      </View>

      <FlatList
        data={templates}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.xl, gap: 12 }}
        renderItem={({ item }) => (
          <PressableScale
            onPress={() => router.push(`/create-template?id=${item.id}`)}
            style={[styles.card, { backgroundColor: colors.surface.secondary }]}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accent.primary + '20' }]}>
                <Ionicons name={getIcon(item.name)} size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.text.primary }]}>{item.name}</Text>
                {item.description && (
                  <Text style={[styles.cardDesc, { color: colors.text.tertiary }]} numberOfLines={1}>{item.description}</Text>
                )}
                <Text style={[styles.cardMeta, { color: colors.text.tertiary }]}>
                  {item.tasks.length} tasks
                </Text>
              </View>
            </View>
            <PressableScale onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color={colors.semantic.error} />
            </PressableScale>
          </PressableScale>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>No Templates</Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>Create a template to save your session setups</Text>
            <Button title="Create Template" onPress={() => router.push('/create-template')} variant="primary" size="md" />
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, gap: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 12, marginTop: 2 },
  cardMeta: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
})
