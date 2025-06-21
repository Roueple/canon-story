// src/hooks/useReadingSettings.ts
'use client'
import { useState, useEffect, useCallback } from 'react';

const FONT_SIZE_KEY = 'reading_font_size';
const AUTOSCROLL_SPEED_KEY = 'reading_autoscroll_speed';
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32; // Increased max font size for better accessibility
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_AUTOSCROLL_SPEED = 3; // 1-5 scale

export interface ReadingSettings {
  fontSize: number;
  autoScrollSpeed: number;
}

export function useReadingSettings() {
  const [isMounted, setIsMounted] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(DEFAULT_AUTOSCROLL_SPEED);

  useEffect(() => {
    setIsMounted(true);
    const storedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (storedFontSize) {
      setFontSize(Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parseInt(storedFontSize, 10))));
    }
    const storedAutoScrollSpeed = localStorage.getItem(AUTOSCROLL_SPEED_KEY);
    if (storedAutoScrollSpeed) {
      setAutoScrollSpeed(parseInt(storedAutoScrollSpeed, 10));
    }
  }, []);

  const updateFontSize = useCallback((newSize: number) => {
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newSize));
    setFontSize(clampedSize);
    if (isMounted) {
      localStorage.setItem(FONT_SIZE_KEY, clampedSize.toString());
    }
  }, [isMounted]);

  const updateAutoScrollSpeed = useCallback((newSpeed: number) => {
    setAutoScrollSpeed(newSpeed);
    if (isMounted) {
      localStorage.setItem(AUTOSCROLL_SPEED_KEY, newSpeed.toString());
    }
  }, [isMounted]);

  return {
    fontSize,
    updateFontSize,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    autoScrollSpeed,
    updateAutoScrollSpeed,
    isSettingsReady: isMounted, // Indicates if settings are loaded from localStorage
  };
}