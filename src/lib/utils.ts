import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a URL-friendly slug from a string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Format a number with commas for display
export function formatNumber(num: number | bigint): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Calculate reading time in minutes based on word count
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 500 // Average reading speed
  return Math.ceil(wordCount / wordsPerMinute)
}

// Format date to a readable string
export function formatDate(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format date to relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}

// Get user initials from name or email
export function getUserInitials(name?: string | null, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return 'U'
}

// Get color for user role
export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    moderator: 'bg-purple-500',
    premium_reader: 'bg-yellow-500',
    reader: 'bg-gray-500'
  }
  return roleColors[role] || roleColors.reader
}

// Get status color for novel/chapter
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    ongoing: 'bg-green-500',
    completed: 'bg-blue-500',
    hiatus: 'bg-yellow-500',
    dropped: 'bg-red-500',
    draft: 'bg-gray-500',
    premium: 'bg-purple-500',
    free: 'bg-green-500'
  }
  return statusColors[status] || 'bg-gray-500'
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Parse chapter number to handle decimals
export function parseChapterNumber(chapterNumber: string | number): number {
  const parsed = typeof chapterNumber === 'string' ? parseFloat(chapterNumber) : chapterNumber
  return isNaN(parsed) ? 0 : parsed
}

// Format chapter number for display
export function formatChapterNumber(chapterNumber: number | string): string {
  const num = parseChapterNumber(chapterNumber.toString())
  // If it's a whole number, don't show decimal
  if (num % 1 === 0) return num.toString()
  // Otherwise, show up to 2 decimal places
  return num.toFixed(2).replace(/\.?0+$/, '')
}
// Alias for backward compatibility
export const slugify = generateSlug;

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}