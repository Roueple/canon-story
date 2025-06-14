// create-chapter-ui.js
// Script 2: Create Chapter Management UI Components
// Run with: node create-chapter-ui.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  // Chapter List Page
  {
    path: 'src/app/(admin)/admin/novels/[id]/chapters/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { formatDate, formatChapterNumber } from '@/lib/utils'

async function getNovel(id: string) {
  const novel = await prisma.novel.findFirst({
    where: { id, isDeleted: false },
    include: {
      chapters: {
        where: { isDeleted: false },
        orderBy: { displayOrder: 'asc' }
      }
    }
  })

  if (!novel) notFound()
  return novel
}

export default async function ChaptersPage({ params }: { params: { id: string } }) {
  const novel = await getNovel(params.id)

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{novel.title} - Chapters</h1>
          <p className="text-gray-400">Manage chapters for this novel</p>
        </div>
        <Link href={\`/admin/novels/\${novel.id}/chapters/create\`}>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  Chapter
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Published
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {novel.chapters.map((chapter) => (
              <tr key={chapter.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-white">
                    Chapter {formatChapterNumber(chapter.chapterNumber)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">{chapter.title}</div>
                  <div className="text-sm text-gray-400">
                    {chapter.wordCount.toLocaleString()} words • {chapter.estimatedReadTime} min read
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={\`inline-flex px-2 py-1 text-xs font-medium rounded-full \${
                      chapter.status === 'draft' ? 'bg-gray-900 text-gray-300' :
                      chapter.status === 'premium' ? 'bg-purple-900 text-purple-300' :
                      'bg-green-900 text-green-300'
                    }\`}>
                      {chapter.status}
                    </span>
                    {chapter.isPublished ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {chapter.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {chapter.publishedAt ? formatDate(chapter.publishedAt) : 'Not published'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={\`/admin/novels/\${novel.id}/chapters/\${chapter.id}/edit\`}>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {novel.chapters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No chapters yet. Add your first chapter!</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>💡 Tip: Chapters support flexible numbering like 0, 1.5, or 2.1 for special content!</p>
      </div>
    </div>
  )
}`
  },

  // Create Chapter Page
  {
    path: 'src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/shared/ui'
import { ChapterForm } from '@/components/admin/forms/ChapterForm'

export default function CreateChapterPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(\`/api/admin/novels/\${params.id}/chapters\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create chapter')
      }

      router.push(\`/admin/novels/\${params.id}/chapters\`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Link 
        href={\`/admin/novels/\${params.id}/chapters\`} 
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Chapter</h1>
        
        <ChapterForm
          novelId={params.id}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}`
  },

  // Edit Chapter Page
  {
    path: 'src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { EditChapterForm } from '@/components/admin/forms/EditChapterForm'

async function getChapter(id: string) {
  const chapter = await prisma.chapter.findFirst({
    where: { id, isDeleted: false },
    include: {
      novel: {
        select: { id: true, title: true }
      }
    }
  })

  if (!chapter) notFound()
  return chapter
}

export default async function EditChapterPage({ 
  params 
}: { 
  params: { id: string, chapterId: string } 
}) {
  const chapter = await getChapter(params.chapterId)

  return (
    <div>
      <Link 
        href={\`/admin/novels/\${params.id}/chapters\`} 
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Chapter</h1>
        
        <EditChapterForm
          chapter={chapter}
        />
      </div>
    </div>
  )
}`
  },

  // Chapter Form Component
  {
    path: 'src/components/admin/forms/ChapterForm.tsx',
    content: `// src/components/admin/forms/ChapterForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button, Input, LoadingSpinner } from '@/components/shared/ui'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

interface ChapterFormProps {
  novelId: string
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  error?: string
  initialData?: {
    title: string
    content: string
    chapterNumber: number
    status: string
    isPublished: boolean
  }
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'premium', label: 'Premium' },
  { value: 'free', label: 'Free' }
]

export function ChapterForm({ 
  novelId, 
  onSubmit, 
  isLoading, 
  error, 
  initialData 
}: ChapterFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    chapterNumber: initialData?.chapterNumber || 1,
    status: initialData?.status || 'draft',
    isPublished: initialData?.isPublished || false
  })

  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    // Calculate word count
    const words = formData.content.trim().split(/\\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [formData.content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chapter Number *
          </label>
          <Input
            type="number"
            step="0.1"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ 
              ...formData, 
              chapterNumber: parseFloat(e.target.value) || 0 
            })}
            placeholder="e.g., 1, 1.5, 0"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="mt-1 text-xs text-gray-400">
            Supports decimals like 1.5 for side stories
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Chapter Title *
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter chapter title"
          required
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Content *
          </label>
          <span className="text-sm text-gray-400">
            {wordCount.toLocaleString()} words
          </span>
        </div>
        <RichTextEditor
          value={formData.content}
          onChange={(content) => setFormData({ ...formData, content })}
          placeholder="Start writing your chapter..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublished"
          checked={formData.isPublished}
          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
          className="h-4 w-4 rounded text-primary bg-gray-700 border-gray-600 focus:ring-primary"
        />
        <label htmlFor="isPublished" className="text-sm text-gray-300">
          Publish this chapter immediately
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Chapter' : 'Create Chapter'}
        </Button>
      </div>
    </form>
  )
}`
  },

  // Edit Chapter Form Component
  {
    path: 'src/components/admin/forms/EditChapterForm.tsx',
    content: `// src/components/admin/forms/EditChapterForm.tsx
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
      const response = await fetch(\`/api/admin/chapters/\${chapter.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update chapter')
      }

      router.push(\`/admin/novels/\${chapter.novelId}/chapters\`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(\`/api/admin/chapters/\${chapter.id}\`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete chapter')
      }

      router.push(\`/admin/novels/\${chapter.novelId}/chapters\`)
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
          chapterNumber: Number(chapter.chapterNumber),
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
          message={\`Are you sure you want to delete "\${chapter.title}"? This action cannot be undone.\`}
          confirmText="DELETE CHAPTER"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}`
  }
];

async function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error);
  }
}

async function main() {
  console.log('📁 Creating Chapter Management UI Components...\n');
  
  for (const file of files) {
    await createFile(file.path, file.content);
  }
  
  console.log('\n✅ Chapter Management UI creation complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node create-rich-editor.js');
  console.log('2. Test the chapter management functionality');
  console.log('3. Create chapters with flexible numbering (0, 1.5, 2.1)');
}

main().catch(console.error);