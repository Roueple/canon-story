// fix-all-ui-issues.js
// Comprehensive fix for all UI/UX issues in Chat 4
// Run with: node fix-all-ui-issues.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  // 1. FIX RICH TEXT EDITOR - Complete rewrite with inline styles
  {
    path: 'src/components/admin/RichTextEditor.tsx',
    content: `// src/components/admin/RichTextEditor.tsx
'use client'

import { useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Heading2,
  Heading3,
  Link,
  Image
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    // Force text color on mount and value change
    if (editorRef.current) {
      editorRef.current.style.color = '#F3F4F6'
      // Apply color to all child elements
      const allElements = editorRef.current.querySelectorAll('*')
      allElements.forEach(el => {
        if (el instanceof HTMLElement && !el.style.color) {
          el.style.color = '#F3F4F6'
        }
      })
    }
  }, [value])

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInput = () => {
    if (editorRef.current) {
      // Ensure new content has proper color
      const allElements = editorRef.current.querySelectorAll('*')
      allElements.forEach(el => {
        if (el instanceof HTMLElement && !el.style.color) {
          el.style.color = '#F3F4F6'
        }
      })
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      handleCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      handleCommand('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      handleCommand('insertImage', url)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  ]

  return (
    <div className="border border-gray-600 rounded-md bg-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-600 bg-gray-800">
        {toolbarButtons.map(({ icon: Icon, command, value, title }) => (
          <button
            key={command + (value || '')}
            type="button"
            onClick={() => handleCommand(command, value)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={title}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-600 mx-1" />
        
        <button
          type="button"
          onClick={insertLink}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </button>
      </div>

      {/* Editor with forced inline styles */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[400px] p-4 focus:outline-none"
        style={{
          color: '#F3F4F6',
          backgroundColor: '#374151',
          caretColor: '#F3F4F6',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: '1.7',
          fontSize: '16px'
        }}
        suppressContentEditableWarning
        placeholder={placeholder}
      />
    </div>
  )
}`
  },

  // 2. FIX CHAPTER LIST - Make edit button always visible
  {
    path: 'src/app/(admin)/admin/novels/[id]/chapters/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown, BookOpen } from 'lucide-react'
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
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{novel.title}</h1>
          <p className="text-gray-400 mt-1">Manage chapters for this novel</p>
        </div>
        <Link href={\`/admin/novels/\${novel.id}/chapters/create\`}>
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Chapters</p>
          <p className="text-2xl font-bold text-white">{novel.chapters.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400">
            {novel.chapters.filter(ch => ch.isPublished).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Drafts</p>
          <p className="text-2xl font-bold text-yellow-400">
            {novel.chapters.filter(ch => !ch.isPublished).length}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {novel.chapters.length > 0 ? (
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
                  Stats
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
                <tr key={chapter.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">
                      Chapter {formatChapterNumber(chapter.chapterNumber)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{chapter.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {chapter.wordCount.toLocaleString()} words • {chapter.estimatedReadTime} min read
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={\`inline-flex px-2 py-1 text-xs font-medium rounded-full \${
                        chapter.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                        chapter.status === 'premium' ? 'bg-purple-900/50 text-purple-300' :
                        'bg-green-900/50 text-green-300'
                      }\`}>
                        {chapter.status}
                      </span>
                      {chapter.isPublished ? (
                        <Eye className="h-4 w-4 text-green-400" title="Published" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" title="Draft" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {chapter.views.toLocaleString()} views
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {chapter.publishedAt ? formatDate(chapter.publishedAt) : 'Not published'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link href={\`/admin/novels/\${novel.id}/chapters/\${chapter.id}/edit\`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No chapters yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first chapter to get started</p>
            <Link href={\`/admin/novels/\${novel.id}/chapters/create\`}>
              <Button variant="primary" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create First Chapter
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Pro Tip:</strong> Chapters support flexible numbering like 0 (prologue), 1.5 (side story), or 2.1 (extended chapter) for special content!
        </p>
      </div>
    </div>
  )
}`
  },

  // 3. FIX NOVEL LIST - Better UI with visible actions
  {
    path: 'src/app/(admin)/admin/novels/page.tsx',
    content: `// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, Trash2, BookOpen, BarChart3 } from 'lucide-react'
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
                  {/* Cover Color */}
                  <div
                    className="h-16 w-16 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: novel.coverColor }}
                  />
                  
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
                        <Eye className="h-4 w-4 text-green-400" title="Published" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" title="Draft" />
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

                {/* Actions - Always Visible */}
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
                  <Link href={\`/admin/novels/\${novel.id}/analytics\`}>
                    <Button size="sm" variant="ghost" title="Analytics">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-16 text-center">
          <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No novels yet</p>
          <p className="text-gray-500 text-sm mt-2">Create your first novel to get started</p>
          <Link href="/admin/novels/create">
            <Button variant="primary" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Novel
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}`
  },

  // 4. ADD GLOBAL EDITOR STYLES to fix contenteditable issues
  {
    path: 'src/app/globals.css',
    content: `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #2563EB;
  --secondary: #6B7280;
  --accent: #3B82F6;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --border: #E5E7EB;
  --muted: #F3F4F6;
  --card: #FFFFFF;
  --cardForeground: #1F2937;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-card: var(--card);
  --color-card-foreground: var(--cardForeground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Theme-specific styles */
.dark {
  color-scheme: dark;
}

.reading {
  color-scheme: light;
}

/* Utility classes for theme colors */
.bg-background { background-color: var(--background); }
.bg-foreground { background-color: var(--foreground); }
.bg-primary { background-color: var(--primary); }
.bg-secondary { background-color: var(--secondary); }
.bg-accent { background-color: var(--accent); }
.bg-success { background-color: var(--success); }
.bg-warning { background-color: var(--warning); }
.bg-error { background-color: var(--error); }
.bg-muted { background-color: var(--muted); }
.bg-card { background-color: var(--card); }

.text-background { color: var(--background); }
.text-foreground { color: var(--foreground); }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-error { color: var(--error); }
.text-muted { color: var(--muted); }
.text-card-foreground { color: var(--cardForeground); }

.border-border { border-color: var(--border); }
.border-primary { border-color: var(--primary); }
.border-secondary { border-color: var(--secondary); }
.border-accent { border-color: var(--accent); }
.border-success { border-color: var(--success); }
.border-warning { border-color: var(--warning); }
.border-error { border-color: var(--error); }

/* CRITICAL: Force white text in admin area contenteditable */
.bg-gray-900 [contenteditable],
.bg-gray-900 [contenteditable] * {
  color: #F3F4F6 !important;
}

/* Ensure placeholder text is visible */
[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9CA3AF !important;
  pointer-events: none;
  display: block;
}

/* Admin area specific styles */
.bg-gray-900 {
  color: #F3F4F6;
}

.bg-gray-900 .prose {
  color: #F3F4F6;
}

/* Fix for content editable in dark mode */
[contenteditable] {
  -webkit-text-fill-color: #F3F4F6;
}

/* Selection colors in editor */
::selection {
  background-color: #3B82F6;
  color: #FFFFFF;
}`
  }
];

async function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
  }
}

async function main() {
  console.log('🔧 Fixing ALL UI/UX Issues Comprehensively...\n');
  
  for (const file of files) {
    await createFile(file.path, file.content);
  }
  
  console.log('\n✅ All UI/UX issues fixed!');
  console.log('\n📋 What was fixed:');
  console.log('1. Rich Text Editor:');
  console.log('   - Forced white text with inline styles');
  console.log('   - Added background color to editor');
  console.log('   - Removed conflicting CSS classes');
  console.log('   - Added color enforcement on all elements');
  console.log('\n2. Chapter List:');
  console.log('   - Made Edit button always visible (not just on hover)');
  console.log('   - Added proper button styling with outline variant');
  console.log('   - Added stats cards at the top');
  console.log('   - Better empty state with icon');
  console.log('\n3. Novel List:');
  console.log('   - Redesigned as cards instead of table');
  console.log('   - All actions always visible');
  console.log('   - Better visual hierarchy');
  console.log('   - Added description preview');
  console.log('\n4. Global Styles:');
  console.log('   - Added contenteditable fixes for admin area');
  console.log('   - Force white text in dark mode');
  console.log('   - Fixed selection colors');
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Hard refresh your browser (Ctrl+F5)');
  console.log('3. Test the editor - text should be white now');
  console.log('4. Check all buttons are visible without hovering');
}

main().catch(console.error);