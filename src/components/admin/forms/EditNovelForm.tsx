
// src/components/admin/forms/EditNovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation'
import { NovelFormWrapper } from './NovelFormWrapper'
import { Button } from '@/components/shared/ui/Button'

interface EditNovelFormProps {
  novel: any
  genres: any[]
  tags: any[]
}

export function EditNovelForm({ novel, genres, tags }: EditNovelFormProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)

  /**
   * This function is passed to the DeleteConfirmation component.
   * It handles the API call and navigation on success.
   * It throws an error on failure, which the DeleteConfirmation component will catch and display.
   */
  const handleDelete = async () => {
    const response = await fetch(`/api/admin/novels/${novel.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete novel')
    }
    
    // On success, redirect and refresh the novel list.
    router.push('/admin/novels')
    router.refresh()
  }

  return (
    <>
      <NovelFormWrapper novel={novel} genres={genres} tags={tags} />

      <div className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-4">Deleting a novel will soft-delete it, making it inaccessible to the public but recoverable by an admin.</p>
        <Button
          variant="danger"
          onClick={() => setShowDelete(true)}
        >
          Delete Novel
        </Button>
      </div>

      {showDelete && (
        <DeleteConfirmation
          title="Delete Novel"
          message={`Are you sure you want to delete "${novel.title}"? This action cannot be undone by moderators.`}
          confirmText="DELETE NOVEL"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
