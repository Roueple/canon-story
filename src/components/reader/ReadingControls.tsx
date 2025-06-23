// src/components/reader/ReadingControls.tsx
'use client'

import { useState } from 'react'
import { Minus, Plus, Play, Pause, Zap, Moon, Sun, BookOpenCheck, Settings2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/shared/ui/Button'
import { cn } from '@/lib/utils'
import type { ThemeName } from '@/config/themes'

interface ReadingControlsProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
  isAutoScrolling: boolean
  onToggleAutoScroll: () => void
  autoScrollSpeed: number
  onAutoScrollSpeedChange: (speed: number) => void
  theme: ThemeName
  onThemeChange: (theme: ThemeName) => void
  isFocusMode: boolean
  onToggleFocusMode: () => void
}

export function ReadingControls({
  fontSize,
  onFontSizeChange,
  isAutoScrolling,
  onToggleAutoScroll,
  autoScrollSpeed,
  onAutoScrollSpeedChange,
  theme,
  onThemeChange,
  isFocusMode,
  onToggleFocusMode
}: ReadingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const minFontSize = 12
  const maxFontSize = 32
  
  const cycleTheme = () => {
    const themes: ThemeName[] = ['light', 'dark', 'reading']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    onThemeChange(themes[nextIndex])
  }
  
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : BookOpenCheck
  
  return (
    <div className={cn(
      "reader-controls fixed bottom-0 left-0 right-0 z-50",
      "bg-card/95 backdrop-blur-md border-t shadow-lg",
      "transition-transform duration-300 ease-in-out",
      isExpanded ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-t-lg hover:bg-primary/90 transition-colors"
        aria-label={isExpanded ? "Hide controls" : "Show controls"}
      >
        <Settings2 className="h-4 w-4" />
      </button>
      
      <div className="container max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-sm font-medium mr-2">Font Size:</span>
            <Button variant="ghost" size="sm" onClick={() => onFontSizeChange(Math.max(fontSize - 1, minFontSize))} disabled={fontSize <= minFontSize} aria-label="Decrease font size">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center bg-muted rounded px-2 py-1">{fontSize}px</span>
            <Button variant="ghost" size="sm" onClick={() => onFontSizeChange(Math.min(fontSize + 1, maxFontSize))} disabled={fontSize >= maxFontSize} aria-label="Increase font size">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={cycleTheme} className="flex items-center gap-2" aria-label="Change theme">
              <ThemeIcon className="h-4 w-4" />
              <span className="capitalize text-xs">{theme}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleFocusMode} className={cn("flex items-center gap-2", isFocusMode && "bg-primary/10")} aria-label={isFocusMode ? "Exit focus mode" : "Enter focus mode"}>
              {isFocusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-xs">Focus</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onToggleAutoScroll} className="flex items-center gap-2" aria-label={isAutoScrolling ? "Stop auto-scroll" : "Start auto-scroll"}>
              {isAutoScrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="text-xs">Auto Scroll</span>
            </Button>
            {isAutoScrolling && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <input type="range" min="1" max="10" value={autoScrollSpeed} onChange={(e) => onAutoScrollSpeedChange(parseInt(e.target.value))} className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" aria-label="Auto-scroll speed" />
                <span className="text-xs w-4">{autoScrollSpeed}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}