// src/components/admin/forms/NovelFormWrapper.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NovelForm, NovelFormData } from './NovelForm'
import { MultiSelectOption } from '@/components/shared/ui/MultiSelect'

// Define more specific types to fix the 'any' type error
interface GenreOption {
  id: string;
  name: string;
}

interface NovelForForm {
  genres: Array<{
    genre: {
      id: string;
    }
  }>;
  // Add other novel properties if needed for type safety, but this is enough for the fix
  [key: string]: any; 
}

interface NovelFormWrapperProps {
  genres: GenreOption[] // From server
  novel?: NovelForForm // Initial novel data for editing
}

export function NovelFormWrapper({ genres, novel }: NovelFormWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const genreOptions: MultiSelectOption[] = genres.map(g => ({ value: g.id, label: g.name }))
  
  // With the new types, TypeScript can infer that 'ng' has a 'genre' property.
  const initialGenreIds = (novel && novel.genres) ? novel.genres.map(ng => ng.genre.id) : []

  const handleSubmit = async (data: NovelFormData) => {
    setIsLoading(true)
    setError('')

    const apiEndpoint = novel ? `/api/admin/novels/${novel.id}` : '/api/admin/novels';
    const method = novel ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${novel ? 'update' : 'create'} novel`)
      }

      // Using replace to prevent back-button issues after form submission
      router.replace('/admin/novels');
      // Refresh to ensure the list is up-to-date
      router.refresh(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <NovelForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      initialData={novel}
      genreOptions={genreOptions}
      initialGenreIds={initialGenreIds}
    />
  )
}