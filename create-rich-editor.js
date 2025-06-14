// create-rich-editor.js
// Script 3: Create Rich Text Editor Component
// Run with: node create-rich-editor.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  // Rich Text Editor Component
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
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle tab for indentation
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
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  ]

  return (
    <div className="border border-gray-600 rounded-md bg-gray-700">
      {/* Toolbar */}
      <div 
        ref={toolbarRef}
        className="flex items-center gap-1 p-2 border-b border-gray-600"
      >
        {toolbarButtons.map(({ icon: Icon, command, value, title }) => (
          <button
            key={command + (value || '')}
            type="button"
            onClick={() => handleCommand(command, value)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
            title={title}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-600 mx-1" />
        
        <button
          type="button"
          onClick={insertLink}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[400px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />

      <style jsx>{\`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          position: absolute;
        }
        
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        
        .prose ul, .prose ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        
        .prose li {
          margin-bottom: 0.5rem;
        }
        
        .prose blockquote {
          border-left: 4px solid #4B5563;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #D1D5DB;
        }
        
        .prose a {
          color: #60A5FA;
          text-decoration: underline;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }
      \`}</style>
    </div>
  )
}`
  },

  // Create API routes for chapters
  {
    path: 'src/app/api/admin/chapters/[id]/route.ts',
    content: `// src/app/api/admin/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

// GET /api/admin/chapters/[id] - Get chapter details
export const GET = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    const chapter = await chapterService.findById(id, true) // Include deleted

    if (!chapter) {
      return errorResponse('Chapter not found', 404)
    }

    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
})

// PUT /api/admin/chapters/[id] - Update chapter
export const PUT = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    const body = await req.json()
    const chapter = await chapterService.update(id, body)

    // Update novel's updatedAt timestamp
    await prisma.novel.update({
      where: { id: chapter.novelId },
      data: { updatedAt: new Date() }
    })
    
    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
})

// DELETE /api/admin/chapters/[id] - Soft delete chapter
export const DELETE = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    await chapterService.softDelete(id, user.id)
    return successResponse({ message: 'Chapter deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
})`
  },

  // Update navigation to include Novels link
  {
    path: 'src/components/admin/AdminSidebar.tsx',
    content: `// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Settings, 
  BarChart3,
  DollarSign,
  FileText,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  role: string
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Novels', href: '/admin/novels', icon: BookOpen },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Gamification', href: '/admin/gamification', icon: Trophy },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: DollarSign },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <aside className="w-64 min-h-screen bg-gray-800 border-r border-gray-700">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(\`\${item.href}/\`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
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
  console.log('📁 Creating Rich Text Editor and Chapter API Routes...\n');
  
  for (const file of files) {
    await createFile(file.path, file.content);
  }
  
  console.log('\n✅ Rich Text Editor creation complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit /admin/novels to test novel management');
  console.log('3. Create a novel and add chapters');
  console.log('4. Test the rich text editor functionality');
}

main().catch(console.error);