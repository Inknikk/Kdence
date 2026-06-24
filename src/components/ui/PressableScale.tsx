import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface PressableScaleProps extends PressableProps {
  scale?: number
  style?: StyleProp<ViewStyle>
}

export function PressableScale({ scale = 0.96, children, style, ...props }: PressableScaleProps) {
  const s = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }))

  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(scale) }}
      onPressOut={() => { s.value = withSpring(1) }}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  )
}
