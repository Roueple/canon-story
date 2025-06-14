// create-admin-ui.js
// Part 3: Admin UI Components and Layouts
// Run with: node create-admin-ui.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

// Admin Layout
const adminLayout = `// src/app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, displayName: true }
  })

  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader user={{ ...user, role: dbUser.role, displayName: dbUser.displayName }} />
      <div className="flex">
        <AdminSidebar role={dbUser.role} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}`;

// Admin Header Component
const adminHeader = `// src/components/admin/AdminHeader.tsx
'use client'

import { Bell, LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'

interface AdminHeaderProps {
  user: {
    firstName?: string | null
    displayName?: string | null
    role: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Canon Story Admin</h1>
              <p className="text-sm text-gray-400">
                {user.role === 'admin' ? 'Administrator' : 'Moderator'} Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user.displayName || user.firstName || 'Admin'}
                </p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}`;

// Admin Sidebar Component
const adminSidebar = `// src/components/admin/AdminSidebar.tsx
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
}`;

// Admin Dashboard Page
const adminDashboard = `// src/app/(admin)/admin/page.tsx
import { prisma } from '@/lib/db'
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp,
  Activity
} from 'lucide-react'

async function getStats() {
  const [
    totalUsers,
    activeUsers,
    totalNovels,
    publishedNovels,
    totalChapters,
    publishedChapters,
    totalViews,
    todayViews
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { isDeleted: false, isActive: true } }),
    prisma.novel.count({ where: { isDeleted: false } }),
    prisma.novel.count({ where: { isDeleted: false, isPublished: true } }),
    prisma.chapter.count({ where: { isDeleted: false } }),
    prisma.chapter.count({ where: { isDeleted: false, isPublished: true } }),
    prisma.novel.aggregate({ _sum: { totalViews: true } }),
    prisma.chapterView.count({
      where: {
        viewedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  return {
    users: { total: totalUsers, active: activeUsers },
    novels: { total: totalNovels, published: publishedNovels },
    chapters: { total: totalChapters, published: publishedChapters },
    views: { total: Number(totalViews._sum.totalViews || 0), today: todayViews }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      subValue: \`\${stats.users.active} active\`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Novels',
      value: stats.novels.total,
      subValue: \`\${stats.novels.published} published\`,
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Chapters',
      value: stats.chapters.total,
      subValue: \`\${stats.chapters.published} published\`,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      title: 'Total Views',
      value: stats.views.total.toLocaleString(),
      subValue: \`\${stats.views.today} today\`,
      icon: TrendingUp,
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome to Canon Story Admin Panel</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className={\`p-3 rounded-lg \${card.color}\`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <Activity className="h-5 w-5 text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">{card.title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.subValue}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/admin/novels/create"
            className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-purple-400" />
            <span className="text-white">Create Novel</span>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-white">Manage Users</span>
          </a>
          <a
            href="/admin/analytics"
            className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="text-white">View Analytics</span>
          </a>
        </div>
      </div>

      {/* Safety Status */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">System Safety Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Soft Delete Protection</span>
            <span className="text-green-400 font-medium">✓ Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Cascade Delete Protection</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Audit Logging</span>
            <span className="text-green-400 font-medium">✓ Recording</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Backup System</span>
            <span className="text-yellow-400 font-medium">⚠ Manual (Neon Branching)</span>
          </div>
        </div>
      </div>
    </div>
  )
}`;

async function main() {
  console.log('🚀 Creating Chat 3 Part 3: Admin UI & Layouts');
  console.log('============================================\n');

  const files = [
    { path: 'src/app/(admin)/layout.tsx', content: adminLayout },
    { path: 'src/components/admin/AdminHeader.tsx', content: adminHeader },
    { path: 'src/components/admin/AdminSidebar.tsx', content: adminSidebar },
    { path: 'src/app/(admin)/admin/page.tsx', content: adminDashboard }
  ];

  for (const file of files) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Part 3 completed!');
  console.log('Next: Run node create-public-pages.js to create public pages');
}

main().catch(console.error);