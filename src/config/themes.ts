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
      background: '#1A1A1A', // Dark grey-black
      foreground: '#E0E0E0', // Light grey for text
      primary: '#60A5FA', // A slightly lighter blue for primary actions
      secondary: '#A0A0A0', // Medium grey for secondary elements
      accent: '#81C784', // A soft green for accents
      success: '#4CAF50', // Green for success
      warning: '#FFC107', // Amber for warning
      error: '#FF5252', // Red for error
      border: '#424242', // Darker grey for borders
      muted: '#2C2C2C', // Muted background elements
      card: '#212121', // Even darker grey for cards/boxes
      cardForeground: '#E0E0E0', // Light grey for card text
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