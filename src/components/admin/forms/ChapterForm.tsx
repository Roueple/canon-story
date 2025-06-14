// src/components/admin/forms/ChapterForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button, Input, LoadingSpinner } from '@/components/shared/ui'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

interface ChapterFormProps {
  novelId: string
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  error?: string
  initialData?: {
    title: string
    content: string
    chapterNumber: number
    status: string
    isPublished: boolean
  }
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'premium', label: 'Premium' },
  { value: 'free', label: 'Free' }
]

export function ChapterForm({ 
  novelId, 
  onSubmit, 
  isLoading, 
  error, 
  initialData 
}: ChapterFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    chapterNumber: initialData?.chapterNumber || 1,
    status: initialData?.status || 'draft',
    isPublished: initialData?.isPublished || false
  })

  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    // Calculate word count
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [formData.content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chapter Number *
          </label>
          <Input
            type="number"
            step="0.1"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ 
              ...formData, 
              chapterNumber: parseFloat(e.target.value) || 0 
            })}
            placeholder="e.g., 1, 1.5, 0"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="mt-1 text-xs text-gray-400">
            Supports decimals like 1.5 for side stories
          </p>
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Chapter Title *
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter chapter title"
          required
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Content *
          </label>
          <span className="text-sm text-gray-400">
            {wordCount.toLocaleString()} words
          </span>
        </div>
        <RichTextEditor
          value={formData.content}
          onChange={(content) => setFormData({ ...formData, content })}
          placeholder="Start writing your chapter..."
        />
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
          Publish this chapter immediately
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
          {initialData ? 'Update Chapter' : 'Create Chapter'}
        </Button>
      </div>
    </form>
  )
}