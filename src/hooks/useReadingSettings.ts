// src/hooks/useReadingSettings.ts
import { useState, useEffect, useCallback } from 'react'

interface ReadingSettings {
  fontSize: number
  lineHeight: number
  fontFamily: string
  autoScrollSpeed: number
  theme: 'light' | 'dark' | 'sepia'
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'sans-serif',
  autoScrollSpeed: 1,
  theme: 'light'
}

const STORAGE_KEY = 'canon-story-reading-settings'

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS)
  const [isSettingsReady, setIsSettingsReady] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (error) {
      console.error('Error loading reading settings:', error)
    } finally {
      setIsSettingsReady(true)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: ReadingSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Error saving reading settings:', error)
    }
  }, [])

  // Update specific setting
  const updateSetting = useCallback(<K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K]
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value }
      saveSettings(updated)
      return updated
    })
  }, [saveSettings])

  // Convenience methods
  const updateFontSize = useCallback((size: number) => {
    updateSetting('fontSize', Math.max(12, Math.min(32, size)))
  }, [updateSetting])

  const updateLineHeight = useCallback((height: number) => {
    updateSetting('lineHeight', Math.max(1.2, Math.min(3, height)))
  }, [updateSetting])

  const updateFontFamily = useCallback((family: string) => {
    updateSetting('fontFamily', family)
  }, [updateSetting])

  const updateAutoScrollSpeed = useCallback((speed: number) => {
    updateSetting('autoScrollSpeed', Math.max(0.1, Math.min(10, speed)))
  }, [updateSetting])

  const updateTheme = useCallback((theme: 'light' | 'dark' | 'sepia') => {
    updateSetting('theme', theme)
  }, [updateSetting])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
  }, [saveSettings])

  return {
    ...settings,
    isSettingsReady,
    updateFontSize,
    updateLineHeight,
    updateFontFamily,
    updateAutoScrollSpeed,
    updateTheme,
    updateSetting,
    resetSettings
  }
}