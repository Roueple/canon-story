'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { themes, type ThemeName } from '@/config/themes'

interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    const themeColors = themes[theme].colors
    
    // Set CSS variables
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(--, value)
    })
    
    // Set theme class
    root.className = theme
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
