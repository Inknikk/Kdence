import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../theme'
import { formatMinutes } from '../../utils'

interface TaskCardProps {
  name: string
  duration: number
  isBreak?: boolean
  isActive?: boolean
  isNext?: boolean
}

export function TaskCard({ name, duration, isBreak, isActive, isNext }: TaskCardProps) {
  const { colors, radii, spacing } = useTheme()

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isActive ? colors.accent.primary : colors.surface.primary,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: isNext ? 1 : 0,
        borderColor: colors.border.subtle,
        opacity: isActive ? 1 : 0.9,
      },
    ]}>
      <View style={styles.row}>
        {isBreak && (
          <View style={[styles.badge, { backgroundColor: colors.semantic.warning + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.semantic.warning }]}>Break</Text>
          </View>
        )}
        {isActive && (
          <View style={[styles.activeDot, { backgroundColor: '#fff' }]} />
        )}
        <Text
          style={[
            styles.name,
            {
              color: isActive ? '#fff' : colors.text.primary,
              fontSize: 15,
              fontWeight: '600',
            },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={[
            styles.duration,
            {
              color: isActive ? '#ffffffcc' : colors.text.secondary,
              fontSize: 13,
            },
          ]}
        >
          {formatMinutes(duration)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1 },
  duration: { fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
})
