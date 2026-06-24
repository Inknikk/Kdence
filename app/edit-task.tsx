import { useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { getTaskById, updateTask, deleteTask, getAllTasks, reorderTasks, createTask } from '../src/stores'
import { Button, PressableScale } from '../src/components/ui'
import { impactLight } from '../src/services/haptics'

const DURATIONS = [5, 10, 15, 20, 25, 30, 45, 50, 60, 90]

export default function EditTaskScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing } = useTheme()
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(25)
  const [isBreak, setIsBreak] = useState(false)
  const [isNew, setIsNew] = useState(true)

  useEffect(() => {
    if (id && id !== 'new') {
      setIsNew(false)
      getTaskById(id).then(task => {
        if (task) {
          setName(task.name)
          setDuration(task.estimatedDuration)
          setIsBreak(task.isBreak)
        }
      })
    }
  }, [id])

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required', 'Enter a task name'); return }

    if (isNew) {
      const tasks = await getAllTasks()
      const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : 0
      await createTask(name.trim(), duration, isBreak, maxOrder + 1)
    } else if (id) {
      await updateTask(id, { name: name.trim(), estimatedDuration: duration, isBreak })
    }
    impactLight()
    router.back()
  }

  async function handleDelete() {
    if (!id) return
    Alert.alert('Delete Task', 'Remove this task from the stack?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteTask(id)
        router.back()
      }},
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {isNew ? 'New Task' : 'Edit Task'}
        </Text>
        <PressableScale onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.accent.primary }]}>Save</Text>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: 24 }}>
        <View>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Task Name</Text>
          <TextInput
            placeholder="e.g. Deep Work Session"
            placeholderTextColor={colors.text.tertiary}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: colors.text.primary, backgroundColor: colors.surface.secondary }]}
            autoFocus
          />
        </View>

        <View>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Duration (minutes)</Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map(d => (
              <PressableScale
                key={d}
                onPress={() => { setDuration(d); impactLight() }}
                style={[styles.durationChip, {
                  backgroundColor: duration === d ? colors.accent.primary : colors.surface.secondary,
                }]}
              >
                <Text style={[styles.durationText, {
                  color: duration === d ? '#fff' : colors.text.secondary,
                  fontWeight: duration === d ? '700' : '500',
                }]}>{d}</Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <PressableScale
          onPress={() => { setIsBreak(!isBreak); impactLight() }}
          style={[styles.toggleRow, { backgroundColor: colors.surface.secondary }]}
        >
          <Ionicons
            name={isBreak ? 'cafe' : 'code-slash'}
            size={20}
            color={isBreak ? colors.semantic.warning : colors.accent.primary}
          />
          <Text style={[styles.toggleText, { color: colors.text.primary }]}>
            Mark as break
          </Text>
          <Ionicons
            name={isBreak ? 'toggle' : 'toggle-outline'}
            size={24}
            color={isBreak ? colors.semantic.warning : colors.text.tertiary}
          />
        </PressableScale>

        {!isNew && (
          <Button
            title="Delete Task"
            onPress={handleDelete}
            variant="secondary"
            size="md"
            style={{ marginTop: 24 }}
          />
        )}
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
  saveText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { fontSize: 16, padding: 14, borderRadius: 12, fontWeight: '500' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 48, alignItems: 'center' },
  durationText: { fontSize: 14 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
  },
  toggleText: { flex: 1, fontSize: 15, fontWeight: '500' },
})
