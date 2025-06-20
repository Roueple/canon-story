// User roles
export type UserRole = 'admin' | 'moderator' | 'premium_reader' | 'reader'

// Novel status
export type NovelStatus = 'ongoing' | 'completed' | 'hiatus' | 'dropped' | 'archived'

// Chapter status
export type ChapterStatus = 'draft' | 'premium' | 'free'

// Tag types
export type TagType = 'theme' | 'warning' | 'demographic'

// Notification types
export type NotificationType = 'milestone' | 'achievement' | 'comment' | 'follow' | 'release'

// Document import status
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Chapter content types
export type ContentType = 'text' | 'image' | 'system_ui' | 'interactive'

// Display types for media
export type MediaDisplayType = 'inline' | 'gallery' | 'background'

// Audit action types
export type AuditAction = 'create' | 'update' | 'delete' | 'restore'

// Backup status
export type BackupStatus = 'completed' | 'failed' | 'in-progress'

// Soft delete interface
export interface SoftDeletable {
  isDeleted: boolean
  deletedAt?: Date | null
  deletedBy?: string | null
  deletionReason?: string | null
}

// Base database types (extended from Prisma)
export interface User extends SoftDeletable {
  id: string
  email: string
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Novel extends SoftDeletable {
  id: string
  title: string
  slug: string
  description?: string | null
  coverColor: string
  authorId: string
  status: NovelStatus
  isPublished: boolean
  isPremium: boolean
  totalViews: bigint
  averageRating: number
  ratingCount: number
  wordCount: number
  estimatedReadTime: number
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  publishedAt?: Date | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Chapter extends SoftDeletable {
  id: string
  novelId: string
  title: string
  slug: string
  content: string
  chapterNumber: number
  displayOrder: number
  wordCount: number
  estimatedReadTime: number
  status: ChapterStatus
  isPublished: boolean
  isPremium: boolean
  views: bigint
  hasImages: boolean
  imageCount: number
  publishedAt?: Date | null
  scheduledAt?: Date | null
  seoTitle?: string | null
  seoDescription?: string | null
  importedFrom?: string | null
  importedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Audit log interface
export interface AuditLog {
  id: string
  userId?: string | null
  action: AuditAction
  modelName: string
  recordId: string
  oldData?: unknown | null
  newData?: unknown | null
  ipAddress?: string | null
  userAgent?: string | null
  timestamp: Date
}

// Deletion log interface
export interface DeletionLog {
  id: string
  userId?: string | null
  modelName: string
  recordId: string
  recordData: unknown
  reason?: string | null
  restorable: boolean
  expiresAt: Date
  deletedAt: Date
  restoredAt?: Date | null
  restoredBy?: string | null
}

// Helper type for models that can be soft deleted
export type WithSoftDelete<T> = T & SoftDeletable

// Helper function to filter out soft deleted items
export function excludeDeleted<T extends SoftDeletable>(items: T[]): T[] {
  return items.filter(item => !item.isDeleted)
}

// Helper function to include only soft deleted items
export function onlyDeleted<T extends SoftDeletable>(items: T[]): T[] {
  return items.filter(item => item.isDeleted)
}

// Reading Progress Data
export interface UserReadingProgressData {
  id: string;
  userId: string;
  novelId: string;
  chapterId: string;
  progressPercentage: number;
  scrollPosition: number;
  lastReadAt: Date;
}

// User Bookmark Data
export interface UserBookmarkData {
  id: string;
  userId: string;
  chapterId: string;
  position?: number | null; // Character position or paragraph, 0 for chapter-level
  note?: string | null;
  isPrivate: boolean;
  createdAt: Date;
}