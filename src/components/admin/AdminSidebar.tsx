
// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  Users, 
  Settings, 
  BarChart3,
  Home,
  Globe,
  Tags,
  FolderKanban,
  Library
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  role: string
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname()

  const mainNav = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Novels', href: '/admin/novels', icon: BookOpen },
    { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  ]

  const contentNav = [
    { name: 'Media Library', href: '/admin/content/media', icon: Library },
    { name: 'Genres', href: '/admin/content/genres', icon: FolderKanban },
    { name: 'Tags', href: '/admin/content/tags', icon: Tags },
  ]

  const settingsNav = [
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]
  
  const renderNav = (items) => {
    return items.map((item) => {
      if (item.adminOnly && role !== 'admin') return null;
      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
      return (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive
              ? 'bg-muted text-foreground'
              : 'text-secondary hover:text-foreground hover:bg-muted'
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </Link>
      )
    })
  }

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border">
      <nav className="p-4 space-y-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-foreground hover:text-white hover:bg-muted mb-2 border border-border"
        >
          <Globe className="h-5 w-5" />
          <span>Go to Homepage</span>
        </Link>

        <div>{renderNav(mainNav)}</div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-foreground uppercase tracking-wider mb-2 mt-4">Content</h3>
          {renderNav(contentNav)}
        </div>
        
        <div>
          <h3 className="px-3 text-xs font-semibold text-foreground uppercase tracking-wider mb-2 mt-4">System</h3>
          {renderNav(settingsNav)}
        </div>
      </nav>
    </aside>
  )
}
