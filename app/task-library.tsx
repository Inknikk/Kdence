import { useState, useMemo } from 'react'
import { View, Text, FlatList, StyleSheet, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { createTask } from '../src/stores'
import { Button, PressableScale } from '../src/components/ui'

interface LibraryItem {
  name: string
  category: string
  duration: number
  icon: keyof typeof Ionicons.glyphMap
}

const LIBRARY_TASKS: LibraryItem[] = [
  { name: 'Deep Work Session', category: 'Work', duration: 90, icon: 'code-slash' },
  { name: 'Focused Writing', category: 'Work', duration: 60, icon: 'create' },
  { name: 'Email Triage', category: 'Work', duration: 25, icon: 'mail' },
  { name: 'Research & Reading', category: 'Work', duration: 45, icon: 'search' },
  { name: 'Code Review', category: 'Work', duration: 30, icon: 'git-branch' },
  { name: 'Strategic Planning', category: 'Work', duration: 60, icon: 'compass' },
  { name: 'Study Session', category: 'Learning', duration: 50, icon: 'school' },
  { name: 'Flashcard Review', category: 'Learning', duration: 25, icon: 'layers' },
  { name: 'Online Course', category: 'Learning', duration: 45, icon: 'play-circle' },
  { name: 'Read a Book', category: 'Learning', duration: 30, icon: 'book' },
  { name: 'Practice Skills', category: 'Learning', duration: 40, icon: 'hammer' },
  { name: 'Morning Pages', category: 'Creative', duration: 20, icon: 'document-text' },
  { name: 'Brain Dump', category: 'Creative', duration: 15, icon: 'cloud-download' },
  { name: 'Sketching', category: 'Creative', duration: 30, icon: 'color-palette' },
  { name: 'Music Practice', category: 'Creative', duration: 45, icon: 'musical-notes' },
  { name: 'Writing Draft', category: 'Creative', duration: 60, icon: 'pencil' },
  { name: 'Meditation', category: 'Wellness', duration: 15, icon: 'leaf' },
  { name: 'Stretch Break', category: 'Wellness', duration: 10, icon: 'walk' },
  { name: 'Workout', category: 'Wellness', duration: 45, icon: 'fitness' },
  { name: 'Walk', category: 'Wellness', duration: 20, icon: 'footsteps' },
  { name: 'Deep Clean', category: 'Household', duration: 25, icon: 'sparkles' },
  { name: 'Organize Space', category: 'Household', duration: 30, icon: 'grid' },
  { name: 'Meal Prep', category: 'Household', duration: 60, icon: 'restaurant' },
  { name: 'Laundry', category: 'Household', duration: 15, icon: 'shirt' },
]

const CATEGORIES = ['All', 'Work', 'Learning', 'Creative', 'Wellness', 'Household']

export default function TaskLibraryScreen() {
  const router = useRouter()
  const { colors, spacing } = useTheme()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return LIBRARY_TASKS.filter(t => {
      const matchCategory = selectedCategory === 'All' || t.category === selectedCategory
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [search, selectedCategory])

  async function handleAddTask(task: LibraryItem) {
    const maxOrder = await getMaxOrder()
    await createTask(task.name, task.duration, false, maxOrder + 1)
    setAddedIds(prev => new Set(prev).add(task.name))
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Task Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.searchWrap, { paddingHorizontal: spacing.xl }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface.secondary }]}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text.primary }]}
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8, paddingVertical: 12 }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <PressableScale
            onPress={() => setSelectedCategory(item)}
            style={[styles.chip, {
              backgroundColor: selectedCategory === item ? colors.accent.primary : colors.surface.secondary,
            }]}
          >
            <Text style={[styles.chipText, {
              color: selectedCategory === item ? '#fff' : colors.text.secondary,
            }]}>{item}</Text>
          </PressableScale>
        )
      }
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        contentContainerStyle={{ padding: spacing.xl, gap: 8 }}
        renderItem={({ item }) => {
          const isAdded = addedIds.has(item.name)
          return (
            <PressableScale
              onPress={() => !isAdded && handleAddTask(item)}
              style={[styles.taskItem, { backgroundColor: colors.surface.secondary, opacity: isAdded ? 0.5 : 1 }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accent.primary + '20' }]}>
                <Ionicons name={item.icon} size={18} color={colors.accent.primary} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskName, { color: colors.text.primary }]}>{item.name}</Text>
                <Text style={[styles.taskMeta, { color: colors.text.tertiary }]}>
                  {item.duration} min · {item.category}
                </Text>
              </View>
              <Ionicons
                name={isAdded ? 'checkmark-circle' : 'add-circle-outline'}
                size={22}
                color={isAdded ? colors.semantic.success : colors.accent.primary}
              />
            </PressableScale>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.text.tertiary, textAlign: 'center', paddingTop: 40 }}>
              No matching tasks found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

async function getMaxOrder(): Promise<number> {
  const { getAllTasks } = await import('../src/stores')
  const tasks = await getAllTasks()
  return tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : 0
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchWrap: { paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  taskItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: '600' },
  taskMeta: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center' },
})
