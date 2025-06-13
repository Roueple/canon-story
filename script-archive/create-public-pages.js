// create-public-pages.js
// Part 4: Public Pages and Navigation Enhancement
// Run with: node create-public-pages.js

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

// Enhanced Public Homepage with Clear Navigation
const publicHomepage = `// src/app/(public)/page.tsx
import { prisma } from '@/lib/db'
import { BookOpen, TrendingUp, Clock, Star, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'

async function getFeaturedNovels() {
  return prisma.novel.findMany({
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
}

export default async function HomePage() {
  const featuredNovels = await getFeaturedNovels()
  const user = await currentUser()
  
  // Check if user is admin
  let isAdmin = false
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })
    isAdmin = dbUser?.role === 'admin' || dbUser?.role === 'moderator'
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
            
            {/* Navigation Links */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/novels"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Novels
              </Link>
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Admin Dashboard
                </Link>
              )}
              
              <Link
                href="/api/test-api"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Test API
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/novels" className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <h3 className="font-medium text-gray-900 dark:text-white">All Novels</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse our collection</p>
            </Link>
            <Link href="/genres" className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <h3 className="font-medium text-gray-900 dark:text-white">Genres</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find by category</p>
            </Link>
            <Link href="/trending" className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <h3 className="font-medium text-gray-900 dark:text-white">Trending</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Popular right now</p>
            </Link>
            <Link href="/ui-test" className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <h3 className="font-medium text-gray-900 dark:text-white">UI Test</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Component showcase</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Novels */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Novels</h2>
            <Link href="/novels" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              View all →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredNovels.map((novel) => (
              <Link
                key={novel.id}
                href={\`/novels/\${novel.id}\`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div
                  className="h-2 w-full rounded-full mb-4"
                  style={{ backgroundColor: novel.coverColor }}
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {novel.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  by {novel.author.displayName || novel.author.username}
                </p>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                  {novel.description || 'No description available.'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {novel._count.chapters} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {novel.averageRating.toFixed(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
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
}`;

// Public Layout (already exists but let's ensure it's correct)
const publicLayout = `// src/app/(public)/layout.tsx
import { Header } from '@/components/shared/layout/Header'
import { Footer } from '@/components/shared/layout/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}`;

// Simple novels listing page
const novelsPage = `// src/app/(public)/novels/page.tsx
export default function NovelsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Novels</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Novel listing functionality will be implemented in Chat 4.
      </p>
    </div>
  )
}`;

// Simple genres page
const genresPage = `// src/app/(public)/genres/page.tsx
export default function GenresPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse by Genre</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Genre browsing functionality will be implemented in Chat 4.
      </p>
    </div>
  )
}`;

// Simple trending page
const trendingPage = `// src/app/(public)/trending/page.tsx
export default function TrendingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Trending Novels</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Trending functionality will be implemented in Chat 4.
      </p>
    </div>
  )
}`;

async function main() {
  console.log('🚀 Creating Chat 3 Part 4: Public Pages & Navigation');
  console.log('==================================================\n');

  const files = [
    { path: 'src/app/(public)/page.tsx', content: publicHomepage },
    { path: 'src/app/(public)/layout.tsx', content: publicLayout },
    { path: 'src/app/(public)/novels/page.tsx', content: novelsPage },
    { path: 'src/app/(public)/genres/page.tsx', content: genresPage },
    { path: 'src/app/(public)/trending/page.tsx', content: trendingPage }
  ];

  for (const file of files) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Part 4 completed!');
  console.log('\n🎉 Chat 3 Implementation Complete!');
  console.log('\nTo test your implementation:');
  console.log('1. Make sure your .env file has all required variables');
  console.log('2. Run: npm run dev');
  console.log('3. Visit: http://localhost:3000');
  console.log('4. Test API: http://localhost:3000/api/test-api');
  console.log('5. Admin panel: http://localhost:3000/admin (requires admin role)');
}

main().catch(console.error);