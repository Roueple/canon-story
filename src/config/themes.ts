// Theme definitions for Canon Story
export const themes = {
  light: {
    name: 'Light',
    colors: {
      background: '#FFFFFF',
      foreground: '#1F2937',
      primary: '#2563EB',
      secondary: '#6B7280',
      accent: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#E5E7EB',
      muted: '#F3F4F6',
      card: '#FFFFFF',
      cardForeground: '#1F2937',
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '#111827',
      foreground: '#F9FAFB',
      primary: '#3B82F6',
      secondary: '#9CA3AF',
      accent: '#60A5FA',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#374151',
      muted: '#1F2937',
      card: '#1F2937',
      cardForeground: '#F9FAFB',
    }
  },
  reading: {
    name: 'Reading (Warm)',
    colors: {
      background: '#FEF3C7',
      foreground: '#92400E',
      primary: '#D97706',
      secondary: '#A16207',
      accent: '#F59E0B',
      success: '#65A30D',
      warning: '#EA580C',
      error: '#DC2626',
      border: '#FDE68A',
      muted: '#FEF3C7',
      card: '#FFFBEB',
      cardForeground: '#92400E',
    }
  }
} as const

export type ThemeName = keyof typeof themes
export type Theme = typeof themes[ThemeName]
