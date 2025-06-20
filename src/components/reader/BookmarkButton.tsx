// src/components/reader/BookmarkButton.tsx
'use client'
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isLoading: boolean;
  className?: string;
}

export function BookmarkButton({ isBookmarked, onToggleBookmark, isLoading, className }: BookmarkButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggleBookmark}
      disabled={isLoading}
      className={className}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {isBookmarked ? (
        <BookmarkCheck size={20} className="text-primary" />
      ) : (
        <Bookmark size={20} />
      )}
      <span className="ml-2 text-xs">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </Button>
  );
}