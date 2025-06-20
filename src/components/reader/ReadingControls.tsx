// src/components/reader/ReadingControls.tsx
'use client'
import { Minus, Plus, Play, Pause, Zap, Moon, Sun, BookOpenCheck, Settings2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';
import { useReadingSettings } from '@/hooks/useReadingSettings';
import { useTheme } from '@/providers/theme-provider'; // Assuming this hook exists
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReadingControlsProps {
  onToggleAutoScroll: () => void;
  isAutoScrolling: boolean;
  className?: string;
}

export function ReadingControls({ onToggleAutoScroll, isAutoScrolling, className }: ReadingControlsProps) {
  const { 
    fontSize, updateFontSize, minFontSize, maxFontSize,
    autoScrollSpeed, updateAutoScrollSpeed, isSettingsReady
  } = useReadingSettings();
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  if (!isSettingsReady) return null; // Don't render until settings are loaded

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'reading'> = ['light', 'dark', 'reading'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : BookOpenCheck;

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border shadow-lg p-3 z-50 transition-transform duration-300", className, showSettings ? "translate-y-0" : "translate-y-[calc(100%-4rem)] md:translate-y-[calc(100%-3.5rem)] hover:translate-y-0")}>
      <button 
        onClick={() => setShowSettings(prev => !prev)} 
        className="absolute -top-8 right-4 md:-top-7 md:right-auto md:left-1/2 md:-translate-x-1/2 bg-primary text-primary-foreground p-2 rounded-t-lg focus:outline-none"
        aria-label={showSettings ? "Hide reading settings" : "Show reading settings"}
      >
        <Settings2 size={20} />
      </button>
      
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Font Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary mr-1">Font:</span>
          <Button variant="ghost" size="sm" onClick={() => updateFontSize(fontSize - 1)} disabled={fontSize <= minFontSize} aria-label="Decrease font size">
            <Minus size={16} />
          </Button>
          <span className="text-sm font-medium w-6 text-center">{fontSize}px</span>
          <Button variant="ghost" size="sm" onClick={() => updateFontSize(fontSize + 1)} disabled={fontSize >= maxFontSize} aria-label="Increase font size">
            <Plus size={16} />
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="sm" onClick={cycleTheme} className="flex items-center gap-1.5" aria-label="Cycle theme">
          <ThemeIcon size={16} /> <span className="capitalize text-xs">{theme}</span>
        </Button>

        {/* Auto Scroll */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleAutoScroll} className="flex items-center gap-1.5" aria-label={isAutoScrolling ? "Pause auto-scroll" : "Play auto-scroll"}>
            {isAutoScrolling ? <Pause size={16} /> : <Play size={16} />}
            <span className="text-xs">Scroll</span>
          </Button>
          {isAutoScrolling && (
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-secondary" />
              <input
                type="range"
                min="1"
                max="5"
                value={autoScrollSpeed}
                onChange={(e) => updateAutoScrollSpeed(parseInt(e.target.value))}
                className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Auto-scroll speed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}