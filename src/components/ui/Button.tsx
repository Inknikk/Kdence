import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { PressableScale } from './PressableScale'
import { useTheme } from '../../theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  style?: ViewStyle
}

export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, style }: ButtonProps) {
  const { colors, radii, spacing, typography } = useTheme()

  const bgColor = variant === 'primary'
    ? colors.accent.primary
    : variant === 'secondary'
    ? colors.surface.secondary
    : 'transparent'

  const textColor = variant === 'primary'
    ? colors.text.inverse
    : colors.text.primary

  const padV = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.lg : spacing.md
  const padH = size === 'sm' ? spacing.lg : size === 'lg' ? spacing['2xl'] : spacing.xl
  const fontSize = size === 'sm' ? typography.fontSize.sm : size === 'lg' ? typography.fontSize.lg : typography.fontSize.base

  return (
    <PressableScale onPress={onPress} disabled={disabled} style={style}>
      <Text style={[
        styles.base,
        {
          backgroundColor: bgColor,
          color: textColor,
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: radii.md,
          fontSize,
          borderWidth: variant === 'ghost' ? 0 : 0,
          opacity: disabled ? 0.5 : 1,
        },
      ]}>
        {title}
      </Text>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    fontWeight: '600',
    textAlign: 'center',
    overflow: 'hidden',
  },
})
