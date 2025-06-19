// src/components/admin/forms/NovelForm.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button, Input } from '@/components/shared/ui'
import { MediaModal } from '@/components/admin/media/MediaModal'
import { ImageIcon, X } from 'lucide-react'

interface NovelFormProps {
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  error?: string
  initialData?: {
    title: string
    description?: string
    coverColor: string
    status: string
    isPublished?: boolean
    coverImageUrl?: string
  }
}

const statusOptions = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
  { value: 'dropped', label: 'Dropped' }
]

const colorOptions = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
]

export function NovelForm({ onSubmit, isLoading, error, initialData }: NovelFormProps) {
  const [isMediaModalOpen, setMediaModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    coverColor: initialData?.coverColor || '#3B82F6',
    status: initialData?.status || 'ongoing',
    isPublished: initialData?.isPublished || false,
    coverImageUrl: initialData?.coverImageUrl || '',
  })

  const handleImageSelect = (media: { url: string }) => {
    setFormData({ ...formData, coverImageUrl: media.url })
    setMediaModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
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
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter novel title"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter novel description"
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cover Image
          </label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-24 h-36 bg-gray-700 rounded-md flex items-center justify-center relative overflow-hidden border border-gray-600">
              {formData.coverImageUrl ? (
                <Image
                  src={formData.coverImageUrl}
                  alt="Cover preview"
                  layout="fill"
                  objectFit="cover"
                  className="bg-gray-800"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-500" />
              )}
            </div>
            <div className="flex-grow">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setMediaModalOpen(true)}>
                  {formData.coverImageUrl ? 'Change Image' : 'Select from Library'}
                </Button>
                {formData.coverImageUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, coverImageUrl: '' })}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Or paste a URL below. The cover color will be used if no image is provided.
              </p>
              <Input
                value={formData.coverImageUrl || ''}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://example.com/image.png"
                className="bg-gray-700 border-gray-600 text-white mt-2"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cover Color (Fallback)
          </label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, coverColor: color })}
                className={`w-10 h-10 rounded-lg border-2 ${
                  formData.coverColor === color
                    ? 'border-white ring-2 ring-offset-2 ring-offset-gray-800 ring-white'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="h-4 w-4 rounded text-primary bg-gray-700 border-gray-600 focus:ring-primary"
          />
          <label htmlFor="isPublished" className="text-sm text-gray-300">
            Publish this novel
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Novel' : 'Create Novel'}
          </Button>
        </div>
      </form>
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={handleImageSelect}
      />
    </>
  )
}