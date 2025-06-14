// proper-button-fix.js
// This script implements the proper, final fix for the Button component
// and restores its usage on the admin novels page.
// Run with: node proper-button-fix.js

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
    console.log(`✅ Updated with PROPER fix: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

const properFixes = [
  // 1. A new, more robust Button component with corrected variant styles.
  {
    path: 'src/components/shared/ui/Button.tsx',
    content: `// src/components/shared/ui/Button.tsx
'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    // PROPER FIX: Explicitly define text color for high contrast on any background.
    outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
    ghost: 'bg-transparent hover:bg-muted text-foreground',
    danger: 'bg-error text-white hover:bg-error/90',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}`
  },
  // 2. Restore the use of the proper Button component on the admin novels page.
  {
    path: 'src/app/(admin)/admin/novels/page.tsx',
    content: `// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Edit, BookText } from 'lucide-react'
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
        select: { chapters: { where: { isDeleted: false } } }
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Novel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chapters</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {novels.map((novel) => (
              <tr key={novel.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {novel.coverImageUrl ? (
                      <img src={novel.coverImageUrl} alt={novel.title} className="h-10 w-10 rounded-lg mr-3 object-cover flex-shrink-0" />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-lg mr-3 flex-shrink-0"
                        style={{ backgroundColor: novel.coverColor }}
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-white">{novel.title}</div>
                      <div className="text-sm text-gray-400">by {novel.author.displayName || novel.author.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full \${
                      novel.isPublished ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    }\`}>
                      {novel.isPublished ? 'Published' : 'Draft'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{novel._count.chapters}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatNumber(novel.totalViews)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(novel.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* REVERTED TO PROPER COMPONENT USAGE */}
                  <div className="flex justify-end gap-2">
                    <Link href={\`/admin/novels/\${novel.id}\`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={\`/admin/novels/\${novel.id}/chapters\`}>
                      <Button size="sm" variant="outline">
                         <BookText className="h-4 w-4 mr-1.5" />
                        Chapters
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}`
  },
];


async function main() {
  console.log("🚀 Applying the PROPER fix for the Button component and restoring page architecture...");
  console.log('======================================================================================\n');

  for (const fix of properFixes) {
    await createFile(fix.path, fix.content);
  }

  console.log('\n✅ Proper fix applied. The temporary solution has been removed.');
  console.log('\nPlease restart your development server and do a hard refresh (Ctrl+Shift+R).');
  console.log('1. Press Ctrl+C in your terminal.');
  console.log('2. Run: npm run dev');
}

main().catch(console.error);