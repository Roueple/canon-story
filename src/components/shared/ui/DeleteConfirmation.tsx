// src/components/shared/ui/DeleteConfirmation.tsx
import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteConfirmationProps {
  title: string
  message: string
  dependencies?: string[]
  confirmText?: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteConfirmation({
  title,
  message,
  dependencies = [],
  confirmText = 'DELETE',
  onConfirm,
  onCancel
}: DeleteConfirmationProps) {
  const [inputValue, setInputValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (inputValue !== confirmText) {
      setError(`Please type "${confirmText}" to confirm`)
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      setError('Delete failed. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <p className="text-gray-600 mb-4">{message}</p>

        {dependencies.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-sm font-medium text-red-800 mb-2">
              This will also delete:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {dependencies.map((dep, i) => (
                <li key={i}>{dep}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type "{confirmText}" to confirm deletion
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            placeholder={confirmText}
            disabled={isDeleting}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || inputValue !== confirmText}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Usage example:
// <DeleteConfirmation
//   title="Delete Novel"
//   message="Are you sure you want to delete this novel?"
//   dependencies={["42 chapters", "156 comments", "89 reviews"]}
//   confirmText="DELETE NOVEL"
//   onConfirm={async () => { await deleteNovel(id) }}
//   onCancel={() => setShowDelete(false)}
// />