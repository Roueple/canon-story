// src/app/(admin)/admin/novels/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button, Input, LoadingSpinner } from '@/components/shared/ui'
import { NovelForm } from '@/components/admin/forms/NovelForm'

export default function CreateNovelPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create novel')
      }

      const result = await response.json()
      // FIX: Redirect to /admin/novels instead of the novel detail page
      router.push('/admin/novels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Link 
        href="/admin/novels" 
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Novel</h1>
        
        <NovelForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}