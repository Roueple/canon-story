'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/shared/ui'
import { ColorPicker } from '@/components/shared/ui/ColorPicker'

interface GenreFormProps {
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  error?: string
  initialData?: {
    name: string
    description?: string
    color: string
  }
}

const colorOptions = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'
];

export function GenreForm({ onSubmit, isLoading, error, initialData }: GenreFormProps) {
  // Get a random color from the options only if creating a new genre
  const defaultColor = initialData?.color || colorOptions[Math.floor(Math.random() * colorOptions.length)];

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    color: defaultColor,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Fantasy"
          required
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
        <ColorPicker
          colors={colorOptions}
          value={formData.color}
          onChange={(color) => setFormData({ ...formData, color })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Genre' : 'Create Genre'}
        </Button>
      </div>
    </form>
  )
}