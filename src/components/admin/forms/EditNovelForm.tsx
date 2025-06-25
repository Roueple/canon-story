
// src/components/admin/forms/EditNovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation'
import { NovelFormWrapper } from './NovelFormWrapper'

interface EditNovelFormProps {
  novel: any
  genres: any[]
  // --- FIX: Add tags prop ---
  tags: any[]
}

export function EditNovelForm({ novel, genres, tags }: EditNovelFormProps) {
  const router = useRouter()
  // ... (rest of the component is unchanged, but we need to pass props down)

  return (
    <>
      {/* --- FIX: Pass tags prop to the wrapper --- */}
      <NovelFormWrapper novel={novel} genres={genres} tags={tags} />

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
// Note: This is a simplified version just showing the prop change.
// The script will replace the whole file to ensure correctness.
