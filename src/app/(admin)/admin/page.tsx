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
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-secondary">Welcome to Canon Story Admin Panel</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-primary" />
              </div>
              <Activity className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="text-sm font-medium text-secondary">{card.title}</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
            <p className="text-sm text-secondary mt-1">{card.subValue}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/admin/novels/create"
            className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-foreground">Create Novel</span>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Users className="h-5 w-5 text-primary" />
            <span className="text-foreground">Manage Users</span>
          </a>
          <a
            href="/admin/analytics"
            className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-foreground">View Analytics</span>
          </a>
        </div>
      </div>

      {/* Safety Status */}
      <div className="mt-8 bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">System Safety Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-secondary">Soft Delete Protection</span>
            <span className="text-success font-medium">✓ Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary">Cascade Delete Protection</span>
            <span className="text-success font-medium">✓ Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary">Audit Logging</span>
            <span className="text-success font-medium">✓ Recording</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary">Backup System</span>
            <span className="text-warning font-medium">⚠ Manual (Neon Branching)</span>
          </div>
        </div>
      </div>
    </div>
  )
}