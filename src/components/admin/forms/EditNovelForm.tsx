// src/components/admin/forms/EditNovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NovelForm } from './NovelForm'
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation'

interface EditNovelFormProps {
  novel: any
  genres: any[]
}

export function EditNovelForm({ novel, genres }: EditNovelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update novel')
      }

      router.refresh()
      router.push('/admin/novels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete novel')
      }

      router.push('/admin/novels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setShowDelete(false)
    }
  }

  return (
    <>
      <NovelForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        initialData={{
          title: novel.title,
          description: novel.description || '',
          coverColor: novel.coverColor,
          status: novel.status,
          isPublished: novel.isPublished,
          coverImageUrl: novel.coverImageUrl || ''
        }}
      />

      <div className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Danger Zone</h3>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Delete Novel
        </button>
      </div>

      {showDelete && (
        <DeleteConfirmation
          title="Delete Novel"
          message={`Are you sure you want to delete "${novel.title}"? This action cannot be undone.`}
          confirmText="DELETE NOVEL"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}