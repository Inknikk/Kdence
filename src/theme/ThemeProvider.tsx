import { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { colors, spacing, radii, typography, shadows, animation, iconSize } from './tokens'

type ColorScheme = 'dark' | 'light'

interface Theme {
  colors: typeof colors
  spacing: typeof spacing
  radii: typeof radii
  typography: typeof typography
  shadows: typeof shadows
  animation: typeof animation
  iconSize: typeof iconSize
  colorScheme: ColorScheme
}

const ThemeContext = createContext<Theme | null>(null)

const lightColors = {
  bg: {
    primary: '#F8F8FA',
    secondary: '#F0F0F5',
    tertiary: '#E8E8F0',
    elevated: '#FFFFFF',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#F5F5FA',
    tertiary: '#EEEEF5',
  },
  accent: {
    primary: '#4A90D9',
    secondary: '#3A7BC8',
    tertiary: '#2A66B8',
  },
  text: {
    primary: '#0D0D12',
    secondary: '#5A5A6E',
    tertiary: '#8A8A9E',
    inverse: '#F1F1F6',
  },
  semantic: {
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    focus: '#4A90D9',
  },
  border: {
    subtle: '#E8E8F0',
    default: '#D0D0DC',
    strong: '#B0B0C0',
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? 'dark'
  const colorScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light'

  const theme = useMemo<Theme>(() => ({
    colors: colorScheme === 'dark' ? colors : lightColors,
    spacing,
    radii,
    typography,
    shadows,
    animation,
    iconSize,
    colorScheme,
  }), [colorScheme])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
