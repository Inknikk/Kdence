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
  const { colors, radii, spacing, typography } = useTheme()

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
        <Text
          style={[
            styles.name,
            {
              color: isActive ? colors.text.inverse : colors.text.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
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
              color: isActive ? colors.text.inverse + 'CC' : colors.text.secondary,
              fontSize: typography.fontSize.sm,
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
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
  },
  duration: {
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
})
