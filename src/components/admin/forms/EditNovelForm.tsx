// src/components/admin/forms/EditNovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation'
import { NovelFormWrapper } from './NovelFormWrapper'

interface EditNovelFormProps {
  novel: any
  genres: any[]
}

export function EditNovelForm({ novel, genres }: EditNovelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/novels/${novel.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete novel')
      router.push('/admin/novels')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setShowDelete(false)
    }
  }

  return (
    <>
      <NovelFormWrapper novel={novel} genres={genres} />

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