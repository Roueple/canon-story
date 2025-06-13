// src/app/(admin)/admin/page.tsx
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
      subValue: `${stats.users.active} active`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Novels',
      value: stats.novels.total,
      subValue: `${stats.novels.published} published`,
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Chapters',
      value: stats.chapters.total,
      subValue: `${stats.chapters.published} published`,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      title: 'Total Views',
      value: stats.views.total.toLocaleString(),
      subValue: `${stats.views.today} today`,
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
              <div className={`p-3 rounded-lg ${card.color}`}>
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
}