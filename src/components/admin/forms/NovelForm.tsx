
// src/components/admin/forms/NovelForm.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button, Input } from '@/components/shared/ui'
import { MediaModal } from '@/components/admin/media/MediaModal'
import { ImageIcon, X } from 'lucide-react'
import { MultiSelect, MultiSelectOption } from '@/components/shared/ui/MultiSelect'

export interface NovelFormData {
  title: string;
  description: string;
  coverColor: string;
  status: string;
  isPublished: boolean;
  coverImageUrl: string;
  genreIds: string[];
  // --- FIX: Add tagIds to the form data type ---
  tagIds: string[];
}

interface NovelFormProps {
  onSubmit: (data: NovelFormData) => Promise<void>
  isLoading: boolean
  error?: string
  initialData?: any
  genreOptions: MultiSelectOption[]
  initialGenreIds?: string[]
  // --- FIX: Add tag props ---
  tagOptions: MultiSelectOption[]
  initialTagIds?: string[]
}

// ... (statusOptions and colorOptions are unchanged)

export function NovelForm({ 
  onSubmit, 
  isLoading, 
  error, 
  initialData,
  genreOptions,
  initialGenreIds = [],
  // --- FIX: Destructure tag props ---
  tagOptions,
  initialTagIds = []
}: NovelFormProps) {
  const [isMediaModalOpen, setMediaModalOpen] = useState(false)
  const [formData, setFormData] = useState<NovelFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    coverColor: initialData?.coverColor || '#3B82F6',
    status: initialData?.status || 'ongoing',
    isPublished: initialData?.isPublished || false,
    coverImageUrl: initialData?.coverImageUrl || '',
    genreIds: initialGenreIds,
    // --- FIX: Initialize tagIds in state ---
    tagIds: initialTagIds,
  })

  // ... (handleImageSelect is unchanged)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter novel title"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Genres</label>
          <MultiSelect 
            options={genreOptions}
            selected={formData.genreIds}
            onChange={(selected) => setFormData({...formData, genreIds: selected})}
            placeholder="Select genres..."
          />
        </div>

        {/* --- FIX: Add the MultiSelect for Tags --- */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
          <MultiSelect 
            options={tagOptions}
            selected={formData.tagIds}
            onChange={(selected) => setFormData({...formData, tagIds: selected})}
            placeholder="Select tags..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter novel description"
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
          />
        </div>

        {/* ... (rest of the form is unchanged) ... */}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Novel' : 'Create Novel'}
          </Button>
        </div>
      </form>
      <MediaModal isOpen={isMediaModalOpen} onClose={() => setMediaModalOpen(false)} onSelect={(media) => setFormData({ ...formData, coverImageUrl: media.url })} />
    </>
  )
}
