'use client'

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadingTimeLeftProps {
  wordsRemaining: number;
  className?: string;
}

export function ReadingTimeLeft({ wordsRemaining, className }: ReadingTimeLeftProps) {
  const minutesLeft = Math.ceil(wordsRemaining / 400); // Using our 400 WPM rate
  
  if (minutesLeft <= 0) return null;
  
  return (
    <div className={cn('reading-time-left', className)}>
      <Clock size={14} className="inline mr-1" />
      {minutesLeft} min left
    </div>
  );
}
