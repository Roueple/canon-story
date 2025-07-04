// src/components/admin/forms/EditChapterForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChapterForm } from './ChapterForm'
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation'

interface EditChapterFormProps {
  chapter: any
}

export function EditChapterForm({ chapter }: EditChapterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update chapter')
      }

      router.push(`/admin/novels/${chapter.novelId}/chapters`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete chapter')
      }

      router.push(`/admin/novels/${chapter.novelId}/chapters`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setShowDelete(false)
    }
  }

  return (
    <>
      <ChapterForm
        novelId={chapter.novelId}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        initialData={{
          title: chapter.title,
          content: chapter.content,
          chapterNumber: chapter.chapterNumber,
          status: chapter.status,
          isPublished: chapter.isPublished
        }}
      />

      <div className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Danger Zone</h3>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Delete Chapter
        </button>
      </div>

      {showDelete && (
        <DeleteConfirmation
          title="Delete Chapter"
          message={`Are you sure you want to delete "${chapter.title}"? This action cannot be undone.`}
          confirmText="DELETE CHAPTER"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}