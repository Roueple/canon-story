// src/app/(public)/page.tsx
import { prisma } from '@/lib/db'
import { BookOpen, TrendingUp, Clock, Star, Shield, ArrowRight, Users, FileText } from 'lucide-react'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { NovelCard } from '@/components/shared/NovelCard'

async function getFeaturedNovels() {
  try {
    return await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false
      },
      include: {
        author: {
          select: { displayName: true, username: true }
        },
        genres: {
          include: { genre: true }
        },
        _count: {
          select: { chapters: true }
        }
      },
      orderBy: { totalViews: 'desc' },
      take: 6
    })
  } catch (error) {
    console.error('Error fetching novels:', error)
    return []
  }
}

async function getStats() {
  try {
    const [novels, chapters, users] = await Promise.all([
      prisma.novel.count({ where: { isDeleted: false } }),
      prisma.chapter.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false } })
    ])
    return { novels, chapters, users }
  } catch {
    return { novels: 0, chapters: 0, users: 0 }
  }
}

export default async function HomePage() {
  const featuredNovels = await getFeaturedNovels()
  const stats = await getStats()
  const user = await currentUser()
  
  let isAdmin = false
  if (user) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      })
      isAdmin = dbUser?.role === 'admin' || dbUser?.role === 'moderator'
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Welcome to Canon Story
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover amazing stories, engage with a vibrant community, and track your reading journey.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/novels"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Novels
              </Link>
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Admin Dashboard
                </Link>
              )}
              
              <Link
                href="/api/test-api"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Test API
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.novels}</div>
              <div className="text-gray-600 dark:text-gray-400">Novels</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.chapters}</div>
              <div className="text-gray-600 dark:text-gray-400">Chapters</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <Users className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users}</div>
              <div className="text-gray-600 dark:text-gray-400">Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/novels" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 dark:text-white">All Novels</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse our collection</p>
            </Link>
            <Link href="/genres" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 dark:text-white">Genres</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find by category</p>
            </Link>
            <Link href="/trending" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 dark:text-white">Trending</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Popular right now</p>
            </Link>
            <Link href="/ui-test" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 dark:text-white">UI Test</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Component showcase</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Novels */}
      {featuredNovels.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Novels</h2>
              <Link href="/novels" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View all →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose Canon Story?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Content</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Immerse yourself in stories with beautiful formatting and media support
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Never lose your place with automatic progress tracking and bookmarks
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Regular Updates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get notified when your favorite stories update with new chapters
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}