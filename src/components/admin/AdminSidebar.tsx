// src/components/admin/AdminSidebar.tsx
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
  Home,
  Globe
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
        {/* Go to Homepage Button */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-gray-700 mb-4 border border-gray-600"
        >
          <Globe className="h-5 w-5" />
          <span>Go to Homepage</span>
        </Link>

        <div className="border-t border-gray-700 pt-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}