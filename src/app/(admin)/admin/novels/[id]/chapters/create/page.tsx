// src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx
'use client'

import { useState } from 'react'
// Make sure useParams is imported
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/shared/ui' // Assuming Button is not used directly, but ChapterForm might use it
import { ChapterForm } from '@/components/admin/forms/ChapterForm'

// Remove params from props
export default function CreateChapterPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>(); // Use the hook
  const novelIdFromParams = routeparams.novelId; // Store the id

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const initialDataFromImport = searchParams.get('fromImport') === 'true'
    ? {
        title: searchParams.get('title') || '',
        content: searchParams.get('content') || '', // Content passed via URL
        chapterNumber: parseFloat(searchParams.get('chapterNumber') || '1'),
        status: 'draft' as const, // Default status for imported chapters
        isPublished: false, // Default for imported, to be edited
      }
    : undefined;

  const handleSubmit = async (data: any) => {
    if (!novelIdFromParams) {
      setError('Novel ID is missing. Cannot create chapter.');
      return;
    }
    setIsLoading(true)
    setError('')

    try {
      // Use novelIdFromParams here
      const response = await fetch(`/api/admin/novels/${novelIdFromParams}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create chapter')
      }

      // And here for the redirect
      router.push(`/admin/novels/${novelIdFromParams}/chapters`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle case where novelIdFromParams might not be immediately available
  if (!novelIdFromParams) {
    // You could show a loading state or an error, or redirect
    // For now, let's prevent rendering the form without an ID
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-white text-lg">Loading chapter creation form...</div>
        </div>
    );
  }

  return (
    <div>
      <Link
        // Use novelIdFromParams here
        href={`/admin/novels/${novelIdFromParams}/chapters`}
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{initialDataFromImport ? "Finalize Imported Chapter" : "Create New Chapter"}</h1>

        <ChapterForm
          // And here for the novelId prop
          novelId={novelIdFromParams}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          initialData={initialDataFromImport}
        />
      </div>
    </div>
  )
}