// src/components/admin/forms/NovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button, Input, MultiSelect, DeleteConfirmation, ColorPicker } from '@/components/shared/ui'
import { MediaModal } from '@/components/admin/media/MediaModal'
import { ImageIcon, X } from 'lucide-react'

// Import Prisma types for strong type safety.
// Run `npx prisma generate` to ensure these types are up to date.
import type { Novel, NovelGenre, NovelTag, Genre, Tag } from '@prisma/client'
import type { MultiSelectOption } from '@/components/shared/ui/MultiSelect'

// =================================================================================
// TYPE DEFINITIONS (DERIVED FROM PRISMA SCHEMA)
// =================================================================================

// Define the possible statuses for a Novel, based on your schema.
// Using a union type prevents invalid status strings.
type NovelStatus = 'ongoing' | 'completed' | 'hiatus' | 'dropped' | 'archived'

/**
 * The shape of the form's state. This is a subset of the Novel model,
 * plus arrays of IDs for many-to-many relationships.
 */
interface NovelFormData {
  title: string
  description: string
  coverColor: string
  coverImageUrl: string
  status: NovelStatus
  isPublished: boolean
  isPremium: boolean
  genreIds: string[]
  tagIds: string[]
}

/**
 * Defines the shape of the `novel` object when passed for editing.
 * This includes the related genres and tags to populate the form correctly.
 * This type should match the result of your Prisma query for a single novel.
 */
export type NovelForForm = Novel & {
  genres: (NovelGenre & { genre: Genre })[]
  tags: (NovelTag & { tag: Tag })[]
}

/**
 * Props for the NovelForm component.
 * Note: `genres` and `tags` are expected to be pre-formatted into
 * `MultiSelectOption[]` by the parent component, following the Single
 * Responsibility Principle.
 */
interface NovelFormProps {
  novel?: NovelForForm
  genres: MultiSelectOption[]
  tags: MultiSelectOption[]
}

// =================================================================================
// CONSTANTS
// =================================================================================

const statusOptions: { value: NovelStatus; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'archived', label: 'Archived' },
]

const colorOptions = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'
];

// =================================================================================
// COMPONENT
// =================================================================================

export function NovelForm({ novel, genres, tags }: NovelFormProps) {
  const router = useRouter()
  const isEditMode = !!novel

  const [formData, setFormData] = useState<NovelFormData>({
    title: novel?.title || '',
    description: novel?.description || '',
    coverColor: novel?.coverColor || colorOptions[Math.floor(Math.random() * colorOptions.length)],
    coverImageUrl: novel?.coverImageUrl || '',
    status: (novel?.status as NovelStatus) || 'ongoing',
    isPublished: novel?.isPublished || false,
    isPremium: novel?.isPremium || false,
    genreIds: novel?.genres?.map((g) => g.genre.id) || [],
    tagIds: novel?.tags?.map((t) => t.tag.id) || [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [isMediaModalOpen, setMediaModalOpen] = useState(false)

  const handleImageSelect = (media: { url: string }) => {
    setFormData({ ...formData, coverImageUrl: media.url })
    setMediaModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const apiEndpoint = isEditMode ? `/api/admin/novels/${novel.id}` : '/api/admin/novels'
    const method = isEditMode ? 'PUT' : 'POST'

    try {
      // The API route will handle taking `formData` and updating the database,
      // including connecting/disconnecting genres and tags.
      const response = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} novel`)
      }

      router.push('/admin/novels')
      router.refresh() // Ensures the novel list is up-to-date
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditMode) return
    
    // The API route will perform the soft delete by setting `isDeleted: true`
    const response = await fetch(`/api/admin/novels/${novel.id}`, { method: 'DELETE' })
    
    if (!response.ok) {
      const errorData = await response.json()
      // This error can be caught and displayed by the DeleteConfirmation component
      throw new Error(errorData.error || 'Failed to delete novel')
    }

    router.push('/admin/novels')
    router.refresh()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Cover Image & Color */}
          <div className="md:col-span-1 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
                <div className="aspect-[2/3] relative w-full rounded-lg bg-gray-700 border-2 border-dashed border-gray-600 flex items-center justify-center">
                {formData.coverImageUrl ? (
                    <>
                    <Image src={formData.coverImageUrl} alt="Cover" fill className="object-cover rounded-md" />
                    <button type="button" onClick={() => setFormData({ ...formData, coverImageUrl: '' })} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-black/80 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                    </>
                ) : (
                    <div className="text-center p-4">
                    <ImageIcon className="h-10 w-10 text-gray-500 mx-auto" />
                    <p className="text-xs text-gray-400 mt-2">No Image Selected</p>
                    </div>
                )}
                </div>
                <Button type="button" variant="outline" className="w-full mt-3" onClick={() => setMediaModalOpen(true)}>
                Choose from Library
                </Button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Color Fallback</label>
                <ColorPicker colors={colorOptions} value={formData.coverColor} onChange={(color) => setFormData({ ...formData, coverColor: color })} />
            </div>
          </div>

          {/* Right Column: Main Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter novel title" required className="bg-gray-700 border-gray-600 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genres</label>
              <MultiSelect options={genres} selected={formData.genreIds} onChange={(selected) => setFormData({ ...formData, genreIds: selected })} placeholder="Select genres..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <MultiSelect options={tags} selected={formData.tagIds} onChange={(selected) => setFormData({ ...formData, tagIds: selected })} placeholder="Select tags..." />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter novel description" rows={8} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Status and Publishing Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700">
           <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as NovelStatus })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md">
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="h-4 w-4 rounded text-primary bg-gray-700 border-gray-600 focus:ring-primary" />
              <span className="text-sm text-gray-300">Publish this novel</span>
            </label>
          </div>
           <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isPremium} onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })} className="h-4 w-4 rounded text-primary bg-gray-700 border-gray-600 focus:ring-primary" />
              <span className="text-sm text-gray-300">Mark as Premium</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{isEditMode ? 'Update Novel' : 'Create Novel'}</Button>
        </div>
      </form>

      {/* Danger Zone for Editing */}
      {isEditMode && (
        <div className="mt-12 pt-6 border-t border-red-500/30">
          <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">Deleting a novel will soft-delete it. The data remains recoverable from the admin panel.</p>
          <Button variant="danger" onClick={() => setShowDelete(true)} disabled={isLoading}>Delete Novel</Button>
        </div>
      )}

      {/* Modals */}
      {showDelete && isEditMode && (
        <DeleteConfirmation
          title="Delete Novel"
          message={`Are you sure you want to delete "${novel.title}"? This action can be reversed by an administrator.`}
          confirmText="DELETE NOVEL"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      <MediaModal isOpen={isMediaModalOpen} onClose={() => setMediaModalOpen(false)} onSelect={handleImageSelect} />
    </>
  )
}