// add-bulk-upload.js
// This script adds the bulk upload button to chapters page and removes analytics button
// Run with: node add-bulk-upload.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

const updates = [
  // UPDATE 1: Add bulk upload button to chapters page
  {
    path: 'src/app/(admin)/admin/novels/[id]/chapters/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useEffect } from 'react'
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown, BookOpen, Upload } from 'lucide-react'
import { Button, Modal } from '@/components/shared/ui'
import { formatDate, formatChapterNumber } from '@/lib/utils'
import { DocumentImporter } from '@/components/admin/import/DocumentImporter'

export default function ChaptersPage({ params }: { params: { id: string } }) {
  const [novel, setNovel] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showImporter, setShowImporter] = useState(false)

  useEffect(() => {
    fetchNovel()
  }, [params.id])

  const fetchNovel = async () => {
    try {
      const response = await fetch(\`/api/admin/novels/\${params.id}\`)
      if (!response.ok) throw new Error('Failed to fetch novel')
      const data = await response.json()
      setNovel(data.data)
    } catch (error) {
      console.error('Error fetching novel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportComplete = () => {
    setShowImporter(false)
    fetchNovel() // Refresh the chapters list
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!novel) {
    notFound()
  }

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{novel.title}</h1>
          <p className="text-gray-400 mt-1">Manage chapters for this novel</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowImporter(true)}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import DOCX
          </Button>
          <Link href={\`/admin/novels/\${novel.id}/chapters/create\`}>
            <Button variant="primary" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Chapters</p>
          <p className="text-2xl font-bold text-white">{novel.chapters?.length || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400">
            {novel.chapters?.filter((ch: any) => ch.isPublished).length || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Drafts</p>
          <p className="text-2xl font-bold text-yellow-400">
            {novel.chapters?.filter((ch: any) => !ch.isPublished).length || 0}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {novel.chapters && novel.chapters.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-white transition-colors">
                    Chapter <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Words</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {novel.chapters.map((chapter: any) => (
                <tr key={chapter.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">
                      {formatChapterNumber(chapter.chapterNumber)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{chapter.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={\`inline-flex px-2 py-1 text-xs font-medium rounded-full \${
                        chapter.status === 'free' ? 'bg-green-900/50 text-green-300' :
                        'bg-yellow-900/50 text-yellow-300'
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
                    {chapter.wordCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(chapter.updatedAt)}
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
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No chapters yet</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first chapter</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowImporter(true)}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import from DOCX
              </Button>
              <Link href={\`/admin/novels/\${novel.id}/chapters/create\`}>
                <Button variant="primary" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Chapter
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImporter && (
        <Modal
          isOpen={showImporter}
          onClose={() => setShowImporter(false)}
          title="Import Chapters from DOCX"
          size="lg"
        >
          <DocumentImporter
            novelId={novel.id}
            onComplete={handleImportComplete}
            onCancel={() => setShowImporter(false)}
          />
        </Modal>
      )}
    </div>
  )
}`
  },

  // UPDATE 2: Remove analytics button from admin novels page
  {
    path: 'src/app/(admin)/admin/novels/page.tsx',
    content: `// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, BookOpen } from 'lucide-react'
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
    orderBy: { updatedAt: 'desc' }
  })
}

export default async function AdminNovelsPage() {
  const novels = await getNovels()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Novels</h1>
          <p className="text-gray-400 mt-1">Manage your novel collection</p>
        </div>
        <Link href="/admin/novels/create">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Novel
          </Button>
        </Link>
      </div>

      {novels.length > 0 ? (
        <div className="grid gap-4">
          {novels.map((novel) => (
            <div key={novel.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Cover Image */}
                  <div className="relative h-24 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                    {novel.coverImageUrl ? (
                      <Image
                        src={novel.coverImageUrl}
                        alt={novel.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: novel.coverColor }}
                      />
                    )}
                  </div>
                  
                  {/* Novel Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {novel.title}
                      </h3>
                      <span className={\`inline-flex px-2 py-1 text-xs font-medium rounded-full \${
                        novel.status === 'ongoing' ? 'bg-green-900/50 text-green-300' :
                        novel.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                        novel.status === 'hiatus' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }\`}>
                        {novel.status}
                      </span>
                      {novel.isPublished ? (
                        <span title="Published">
                          <Eye className="h-4 w-4 text-green-400" />
                        </span>
                      ) : (
                        <span title="Draft">
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">
                      by {novel.author.displayName || novel.author.username}
                    </p>
                    
                    {novel.description && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                        {novel.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {novel._count.chapters} chapters
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(novel.totalViews)} views
                      </div>
                      <div>
                        Updated {formatDate(novel.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions - Removed Analytics button */}
                <div className="flex items-center gap-2 ml-4">
                  <Link href={\`/admin/novels/\${novel.id}\`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={\`/admin/novels/\${novel.id}/chapters\`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      Chapters
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">No novels yet</h2>
          <p className="text-gray-400 mb-6">Get started by creating your first novel</p>
          <Link href="/admin/novels/create">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Novel
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}`
  },

  // CREATE 3: Document Importer Component (if it doesn't exist)
  {
    path: 'src/components/admin/import/DocumentImporter.tsx',
    content: `// src/components/admin/import/DocumentImporter.tsx
'use client'

import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/ui'

interface DocumentImporterProps {
  novelId: string
  onComplete?: () => void
  onCancel?: () => void
}

export function DocumentImporter({ novelId, onComplete, onCancel }: DocumentImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle')
  
  const [settings, setSettings] = useState({
    chapterNumberStart: 1,
    importAsPublished: false,
    importAsPremium: false,
    splitByHeading: true,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile)
      setError(null)
    } else {
      setError('Please select a valid DOCX file')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setStatus('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('novelId', novelId)
    formData.append('settings', JSON.stringify(settings))

    try {
      const response = await fetch('/api/admin/import/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { data } = await response.json()
      setImportId(data.importId)
      setStatus('processing')
      
      // Poll for import status
      pollImportStatus(data.importId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('failed')
      setIsUploading(false)
    }
  }

  const pollImportStatus = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(\`/api/admin/import/status/\${id}\`)
        const { data } = await response.json()

        if (data.progress) {
          setProgress(data.progress)
        }

        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setStatus('completed')
          setIsUploading(false)
          setTimeout(() => {
            onComplete?.()
          }, 2000)
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setError(data.errorMessage || 'Import failed')
          setStatus('failed')
          setIsUploading(false)
        }
      } catch (err) {
        clearInterval(pollInterval)
        setError('Failed to check import status')
        setStatus('failed')
        setIsUploading(false)
      }
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
          id="docx-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="docx-upload"
          className="cursor-pointer block"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">
            {file ? file.name : 'Click to select a DOCX file'}
          </p>
          <p className="text-sm text-gray-400">
            Maximum file size: 25MB
          </p>
        </label>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Import Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Starting Chapter Number
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={settings.chapterNumberStart}
            onChange={(e) => setSettings({ ...settings, chapterNumberStart: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.importAsPublished}
              onChange={(e) => setSettings({ ...settings, importAsPublished: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-300">Import as published</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.importAsPremium}
              onChange={(e) => setSettings({ ...settings, importAsPremium: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-300">Import as premium chapters</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.splitByHeading}
              onChange={(e) => setSettings({ ...settings, splitByHeading: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-300">Split into chapters by headings</span>
          </label>
        </div>
      </div>

      {/* Progress */}
      {status === 'processing' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Processing chapters...</span>
            <span className="text-white">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: \`\${progress}%\` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-md">
          <CheckCircle className="h-5 w-5" />
          <span>Import completed successfully!</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          isLoading={isUploading}
        >
          {isUploading ? 'Processing...' : 'Import Chapters'}
        </Button>
      </div>
    </div>
  )
}`
  }
];

async function main() {
  console.log('🚀 Adding bulk upload functionality and removing analytics button...');
  console.log('================================================\n');

  for (const update of updates) {
    await createFile(update.path, update.content);
  }

  console.log('\n✅ All updates completed successfully!');
  console.log('\n📋 Summary of changes:');
  console.log('1. ✅ Added "Import DOCX" button to the chapters page');
  console.log('2. ✅ Removed the Analytics button from the admin novels page');
  console.log('3. ✅ Created DocumentImporter component for handling bulk uploads');
  
  console.log('\n🎯 Features added:');
  console.log('- Import button appears in two places on chapters page:');
  console.log('  • Top right corner next to "Add Chapter"');
  console.log('  • In the empty state when no chapters exist');
  console.log('- Clicking "Import DOCX" opens a modal with upload options');
  console.log('- You can configure chapter numbering, publication status, and more');
  
  console.log('\n💡 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Navigate to any novel\'s chapters page');
  console.log('3. Click "Import DOCX" to bulk upload chapters');
  console.log('4. The analytics button is now removed from the novels list');
}

main().catch(console.error);