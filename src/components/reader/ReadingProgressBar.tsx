// src/components/reader/ReadingProgressBar.tsx
'use client'
import { ProgressBar as SharedProgressBar } from '@/components/shared/ui/ProgressBar'; // Use shared component

interface ReadingProgressBarProps {
  currentProgress: number; // 0-100
  className?: string;
}

export function ReadingProgressBar({ currentProgress, className }: ReadingProgressBarProps) {
  return (
    <div className={className}>
      <SharedProgressBar value={currentProgress} variant="primary" />
    </div>
  );
}