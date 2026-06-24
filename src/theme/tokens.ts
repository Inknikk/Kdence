export const colors = {
  bg: {
    primary: '#0D0D12',
    secondary: '#14141B',
    tertiary: '#1C1C26',
    elevated: '#242430',
  },
  surface: {
    primary: '#1A1A26',
    secondary: '#22222E',
    tertiary: '#2A2A36',
  },
  accent: {
    primary: '#4A90D9',
    secondary: '#6DAAEF',
    tertiary: '#96C4F7',
  },
  text: {
    primary: '#F1F1F6',
    secondary: '#A0A0B2',
    tertiary: '#6B6B80',
    inverse: '#0D0D12',
  },
  semantic: {
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    focus: '#4A90D9',
  },
  border: {
    subtle: '#2A2A36',
    default: '#3A3A46',
    strong: '#4A4A56',
  },
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
}

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
}

export const typography = {
  fontFamily: {
    heading: undefined,
    body: undefined,
    mono: undefined,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
}

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1] as readonly number[],
    easeInOut: [0.65, 0, 0.35, 1] as readonly number[],
    spring: {
      damping: 20,
      stiffness: 100,
      mass: 0.5,
    },
  },
}

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 }
