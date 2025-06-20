// src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'; // Updated import
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/shared/ui'
import { ChapterForm } from '@/components/admin/forms/ChapterForm'

export default function CreateChapterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/novels/${params.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json() // Renamed to avoid conflict
        throw new Error(errorData.error || 'Failed to create chapter')
      }

      router.push(`/admin/novels/${params.id}/chapters`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Link 
        href={`/admin/novels/${params.id}/chapters`} 
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{initialDataFromImport ? "Finalize Imported Chapter" : "Create New Chapter"}</h1>
        
        <ChapterForm
          novelId={params.id}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          initialData={initialDataFromImport}
        />
      </div>
    </div>
  )
}