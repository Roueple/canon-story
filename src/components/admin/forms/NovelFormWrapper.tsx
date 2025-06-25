
// src/components/admin/forms/NovelFormWrapper.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NovelForm, NovelFormData } from './NovelForm'
import { MultiSelectOption } from '@/components/shared/ui/MultiSelect'

interface DataOption {
  id: string;
  name: string;
}

interface NovelForForm {
  genres: Array<{ genre: { id: string } }>;
  // --- FIX: Add tags type to the novel object ---
  tags: Array<{ tag: { id: string } }>;
  [key: string]: any; 
}

interface NovelFormWrapperProps {
  genres: DataOption[]
  // --- FIX: Add tags prop ---
  tags: DataOption[]
  novel?: NovelForForm
}

export function NovelFormWrapper({ genres, tags, novel }: NovelFormWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const genreOptions: MultiSelectOption[] = genres.map(g => ({ value: g.id, label: g.name }))
  const initialGenreIds = novel?.genres?.map(ng => ng.genre.id) || []

  // --- FIX: Create tag options and get initial selections ---
  const tagOptions: MultiSelectOption[] = tags.map(t => ({ value: t.id, label: t.name }))
  const initialTagIds = novel?.tags?.map(nt => nt.tag.id) || []

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
      
      router.push('/admin/novels');
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
      // --- FIX: Pass tag options and initial selections to the form ---
      tagOptions={tagOptions}
      initialTagIds={initialTagIds}
    />
  )
}
