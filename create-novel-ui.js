// create-novel-ui.js
// Script 1: Create Novel Management UI Components
// Run with: node create-novel-ui.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  // Admin Novel List Page
  {
    path: 'src/app/(admin)/admin/novels/page.tsx',
    content: `// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { formatDate, formatNumber } from '@/lib/utils'

async function getNovels() {
  return await prisma.novel.findMany({
    where: { isDeleted: false },
    include: {
      author: {
        select: { displayName: true, username: true }
      },
      _count: {
        select: { chapters: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function AdminNovelsPage() {
  const novels = await getNovels()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Novels</h1>
          <p className="text-gray-400">Manage your novel collection</p>
        </div>
        <Link href="/admin/novels/create">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Novel
          </Button>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Novel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Chapters
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {novels.map((novel) => (
              <tr key={novel.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="h-10 w-10 rounded-lg mr-3"
                      style={{ backgroundColor: novel.coverColor }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {novel.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        by {novel.author.displayName || novel.author.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={\`inline-flex px-2 py-1 text-xs font-medium rounded-full \${
                      novel.status === 'ongoing' ? 'bg-green-900 text-green-300' :
                      novel.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                      novel.status === 'hiatus' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-900 text-gray-300'
                    }\`}>
                      {novel.status}
                    </span>
                    {novel.isPublished ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {novel._count.chapters}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatNumber(novel.totalViews)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(novel.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link href={\`/admin/novels/\${novel.id}\`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={\`/admin/novels/\${novel.id}/chapters\`}>
                      <Button size="sm" variant="ghost">
                        Chapters
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {novels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No novels yet. Create your first novel!</p>
          </div>
        )}
      </div>
    </div>
  )
}`
  },

  // Create Novel Page
  {
    path: 'src/app/(admin)/admin/novels/create/page.tsx',
    content: `// src/app/(admin)/admin/novels/create/page.tsx
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
      router.push(\`/admin/novels/\${result.data.id}\`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
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
}`
  },

  // Edit Novel Page
  {
    path: 'src/app/(admin)/admin/novels/[id]/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { EditNovelForm } from '@/components/admin/forms/EditNovelForm'

async function getNovel(id: string) {
  const novel = await prisma.novel.findFirst({
    where: { id, isDeleted: false },
    include: {
      genres: {
        include: { genre: true }
      },
      tags: {
        include: { tag: true }
      }
    }
  })

  if (!novel) notFound()
  return novel
}

async function getGenres() {
  return await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
}

export default async function EditNovelPage({ params }: { params: { id: string } }) {
  const [novel, genres] = await Promise.all([
    getNovel(params.id),
    getGenres()
  ])

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Novel</h1>
        
        <EditNovelForm
          novel={novel}
          genres={genres}
        />
      </div>
    </div>
  )
}`
  },

  // Novel Form Component
  {
    path: 'src/components/admin/forms/NovelForm.tsx',
    content: `// src/components/admin/forms/NovelForm.tsx
'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/shared/ui'

interface NovelFormProps {
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  error?: string
  initialData?: {
    title: string
    description?: string
    coverColor: string
    status: string
  }
}

const statusOptions = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
  { value: 'dropped', label: 'Dropped' }
]

const colorOptions = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
]

export function NovelForm({ onSubmit, isLoading, error, initialData }: NovelFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    coverColor: initialData?.coverColor || '#3B82F6',
    status: initialData?.status || 'ongoing'
  })

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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Title *
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter novel title"
          required
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter novel description"
          rows={4}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cover Color
        </label>
        <div className="flex gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, coverColor: color })}
              className={\`w-10 h-10 rounded-lg border-2 \${
                formData.coverColor === color
                  ? 'border-white'
                  : 'border-transparent'
              }\`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
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
          {initialData ? 'Update Novel' : 'Create Novel'}
        </Button>
      </div>
    </form>
  )
}`
  },

  // Edit Novel Form Component
  {
    path: 'src/components/admin/forms/EditNovelForm.tsx',
    content: `// src/components/admin/forms/EditNovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NovelForm } from './NovelForm'
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation'

interface EditNovelFormProps {
  novel: any
  genres: any[]
}

export function EditNovelForm({ novel, genres }: EditNovelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(\`/api/admin/novels/\${novel.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update novel')
      }

      router.refresh()
      router.push('/admin/novels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(\`/api/admin/novels/\${novel.id}\`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete novel')
      }

      router.push('/admin/novels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setShowDelete(false)
    }
  }

  return (
    <>
      <NovelForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        initialData={{
          title: novel.title,
          description: novel.description || '',
          coverColor: novel.coverColor,
          status: novel.status
        }}
      />

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
          message={\`Are you sure you want to delete "\${novel.title}"? This action cannot be undone.\`}
          confirmText="DELETE NOVEL"
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
  console.log('📁 Creating Novel Management UI Components...\n');
  
  for (const file of files) {
    await createFile(file.path, file.content);
  }
  
  console.log('\n✅ Novel Management UI creation complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node create-chapter-ui.js');
  console.log('2. Run: node create-rich-editor.js');
  console.log('3. Test the novel management at /admin/novels');
}

main().catch(console.error);