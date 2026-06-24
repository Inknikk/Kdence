import { useState } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { createTemplate } from '../src/stores'
import { PressableScale, Button } from '../src/components/ui'

interface TemplateTaskInput {
  name: string
  duration: number
  isBreak: boolean
}

export default function CreateTemplateScreen() {
  const router = useRouter()
  const { colors, spacing } = useTheme()
  const [name, setName] = useState('')
  const [tasks, setTasks] = useState<TemplateTaskInput[]>([
    { name: 'Deep Work', duration: 50, isBreak: false },
    { name: 'Short Break', duration: 10, isBreak: true },
    { name: 'Deep Work', duration: 50, isBreak: false },
  ])

  function addTask() {
    setTasks(prev => [...prev, { name: '', duration: 25, isBreak: false }])
  }

  function updateTask(index: number, data: Partial<TemplateTaskInput>) {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, ...data } : t))
  }

  function removeTask(index: number) {
    setTasks(prev => prev.filter((_, i) => i !== index))
  }

  function toggleBreak(index: number) {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, isBreak: !t.isBreak } : t))
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter a template name'); return }
    if (tasks.length === 0) { Alert.alert('Tasks required', 'Add at least one task'); return }
    if (tasks.some(t => !t.name.trim())) { Alert.alert('Names required', 'All tasks need a name'); return }

    await createTemplate(name.trim(), tasks.map(t => ({
      name: t.name.trim(),
      estimatedDuration: t.duration,
      isBreak: t.isBreak,
    })))
    router.back()
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Create Template</Text>
        <PressableScale onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.accent.primary }]}>Save</Text>
        </PressableScale>
      </View>

      <View style={[styles.nameSection, { paddingHorizontal: spacing.xl }]}>
        <TextInput
          placeholder="Template name"
          placeholderTextColor={colors.text.tertiary}
          value={name}
          onChangeText={setName}
          style={[styles.nameInput, { color: colors.text.primary }]}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.xl, gap: 8 }}
        renderItem={({ item, index }) => (
          <View style={[styles.taskCard, { backgroundColor: colors.surface.secondary }]}>
            <View style={styles.taskHeader}>
              <PressableScale onPress={() => toggleBreak(index)}>
                <Ionicons
                  name={item.isBreak ? 'cafe' : 'code-slash'}
                  size={18}
                  color={item.isBreak ? colors.semantic.warning : colors.accent.primary}
                />
              </PressableScale>
              <TextInput
                placeholder="Task name"
                placeholderTextColor={colors.text.tertiary}
                value={item.name}
                onChangeText={v => updateTask(index, { name: v })}
                style={[styles.taskInput, { color: colors.text.primary }]}
              />
              <PressableScale onPress={() => removeTask(index)}>
                <Ionicons name="close-circle" size={20} color={colors.semantic.error} />
              </PressableScale>
            </View>
            <View style={styles.durationRow}>
              {[5, 10, 15, 25, 30, 45, 50, 60, 90].map(d => (
                <PressableScale
                  key={d}
                  onPress={() => updateTask(index, { duration: d })}
                  style={[styles.durationChip, {
                    backgroundColor: item.duration === d ? colors.accent.primary : colors.bg.primary,
                  }]}
                >
                  <Text style={[styles.durationText, {
                    color: item.duration === d ? '#fff' : colors.text.secondary,
                  }]}>{d}</Text>
                </PressableScale>
              ))}
            </View>
          </View>
        )}
        ListFooterComponent={
          <Button title="Add Task" onPress={addTask} variant="ghost" size="sm" />
        }
      />

      <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        <Button title="Save Template" onPress={handleSave} variant="primary" size="lg" />
      </View>
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
  nameSection: { paddingBottom: 16 },
  nameInput: { fontSize: 24, fontWeight: '700', paddingVertical: 8 },
  taskCard: { borderRadius: 14, padding: 14, gap: 10 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  durationChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  durationText: { fontSize: 12, fontWeight: '600' },
  footer: {},
})
