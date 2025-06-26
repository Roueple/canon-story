// fix.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Helper Functions ---
async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content.trim(), 'utf-8');
        console.log(`✅ Wrote: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${filePath}:`, error);
    }
}

async function removePath(targetPath) {
    try {
        const resolvedPath = path.resolve(process.cwd(), targetPath);
        await fs.rm(resolvedPath, { recursive: true, force: true });
        console.log(`🗑️  Removed: ${targetPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore "file not found" errors
            console.error(`❌ Error removing ${targetPath}:`, error);
        } else {
            console.log(`- Path not found, skipping removal: ${targetPath}`);
        }
    }
}

// --- File Content Definitions ---

const placeholderPageComponentContent = `
// src/components/shared/PlaceholderPage.tsx
import { ShieldAlert } from 'lucide-react';

export function PlaceholderPage({ title = "Coming Soon", message = "This page is under construction and will be available soon." }: { title?: string, message?: string }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-lg text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
`;

const placeholderPageContent = (pageName) => `
// src/app/(public)/${pageName.toLowerCase()}/page.tsx
import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function ${pageName}Page() {
    return <PlaceholderPage />;
}
`;

const bookCarouselComponentContent = `
// src/components/discovery/BookCarousel.tsx
import { NovelCard } from '@/components/shared/NovelCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BookCarouselProps {
  title: string;
  novels: any[];
  viewAllHref?: string;
}

export function BookCarousel({ title, novels, viewAllHref }: BookCarouselProps) {
  if (!novels || novels.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="relative">
        <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          {novels.map(novel => (
            <div key={novel.id} className="w-48 flex-shrink-0">
              <NovelCard novel={novel} />
            </div>
          ))}
           <div className="w-1 flex-shrink-0"></div>
        </div>
      </div>
    </section>
  );
}
`;

const newLandingPageContent = `
// src/app/(public)/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { BookCarousel } from '@/components/discovery/BookCarousel';
import { Button } from '@/components/shared/ui';
import { LoadingSpinner } from '@/components/shared/ui';
import { CheckCircle, BookOpen, MessageSquare, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

const novelCardInclude = {
  author: { select: { displayName: true, username: true } },
  genres: { include: { genre: true } },
  _count: { select: { chapters: { where: { isPublished: true, isDeleted: false } } } },
  coverImageUrl: true,
  title: true,
  slug: true,
  id: true,
  description: true,
  totalViews: true,
  averageRating: true,
};

async function getTrendingNovels() {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { totalViews: 'desc' },
    take: 10
  });
  return serializeForJSON(novels);
}

async function getHottestInFantasy() {
    const fantasyGenre = await prisma.genre.findUnique({
        where: { slug: 'fantasy' },
        select: { id: true }
    });
    if (!fantasyGenre) return [];

    const novels = await prisma.novel.findMany({
        where: {
            isPublished: true,
            isDeleted: false,
            genres: { some: { genreId: fantasyGenre.id } }
        },
        include: novelCardInclude,
        orderBy: { totalViews: 'desc' },
        take: 10,
    });
    return serializeForJSON(novels);
}

async function getNewlyAddedNovels() {
    const novels = await prisma.novel.findMany({
        where: { isPublished: true, isDeleted: false },
        include: novelCardInclude,
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
    return serializeForJSON(novels);
}


function HeroSection() {
    return (
        <section className="text-center py-20 bg-gradient-to-b from-card to-background">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                Your Next Favorite Story Awaits.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-secondary">
                Discover thousands of web novels and original stories from every genre imaginable. New chapters added daily.
            </p>
            <div className="mt-8">
                <Link href="/browse">
                    <Button size="lg">Start Reading for Free</Button>
                </Link>
                <p className="mt-3 text-sm text-muted-foreground">No credit card required.</p>
            </div>
        </section>
    );
}

function FeaturesSection() {
    const features = [
      { icon: Search, title: "Discover", description: "Find your next obsession with powerful search, curated collections, and personalized recommendations." },
      { icon: BookOpen, title: "Read", description: "Immerse yourself in a superior, customizable reader with dark mode, font adjustments, and progress tracking." },
      { icon: MessageSquare, title: "Engage", description: "Leave comments, review your favorite novels, and connect directly with authors and fellow fans." }
    ];
    return (
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {features.map(feature => (
              <div key={feature.title}>
                <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
}

function FinalCtaSection() {
    return (
        <section className="py-20 text-center">
            <h2 className="text-3xl font-bold text-foreground">Ready to Begin Your Next Adventure?</h2>
            <p className="mt-2 text-lg text-secondary">Thousands of worlds are waiting to be discovered.</p>
            <div className="mt-6">
                <Link href="/browse">
                    <Button size="lg" variant="secondary">Browse All Novels</Button>
                </Link>
            </div>
        </section>
    );
}

async function BookShowcase() {
    const [trending, fantasy, recent] = await Promise.all([
        getTrendingNovels(),
        getHottestInFantasy(),
        getNewlyAddedNovels()
    ]);

    return (
        <div className="container mx-auto px-4 space-y-8">
            <BookCarousel title="Trending Now" novels={trending} viewAllHref="/trending" />
            <BookCarousel title="Hottest in Fantasy" novels={fantasy} viewAllHref="/genres/fantasy" />
            <BookCarousel title="Newly Added" novels={recent} viewAllHref="/novels" />
        </div>
    );
}

export default function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <HeroSection />
            <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <BookShowcase />
            </Suspense>
            <FeaturesSection />
            <FinalCtaSection />
        </div>
    );
}
`;

const updatedHeaderContent = `
// src/components/shared/layout/Header.tsx
'use client'

import Link from 'next/link'
import { UserButton, useUser, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { BookOpen, Menu, Moon, Sun, BookOpenCheck } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/providers/theme-provider'
import { Button } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, isLoaded } = useUser()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const themeIcons = {
    light: Sun,
    dark: Moon,
    reading: BookOpenCheck
  }

  const ThemeIcon = themeIcons[theme]

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'reading'> = ['light', 'dark', 'reading']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const isAdminOrModerator = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-card-foreground">
                Canon Story
              </span>
            </Link>


            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-4">
              <Link
                href="/browse"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-foreground"
              >
                Browse
              </Link>
              <Link
                href="/genres"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-foreground"
              >
                Genres
              </Link>
              <Link
                href="/trending"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-foreground"
              >
                Trending
              </Link>
              {isLoaded && isAdminOrModerator && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-warning hover:text-warning/80"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              <ThemeIcon className="h-5 w-5" />
            </button>

            {/* User Menu */}
            {isLoaded && (
              <>
                <SignedIn>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="sm">Sign In</Button>
                  </SignInButton>
                </SignedOut>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            <Link
              href="/browse"
              className="block px-3 py-2 text-base font-medium text-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/genres"
              className="block px-3 py-2 text-base font-medium text-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Genres
            </Link>
            <Link
              href="/trending"
              className="block px-3 py-2 text-base font-medium text-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trending
            </Link>
            {isLoaded && isAdminOrModerator && (
              <Link
                href="/admin"
                className="block px-3 py-2 text-base font-medium text-warning hover:text-warning/80"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
`;

const updatedFooterContent = `
// src/components/shared/layout/Footer.tsx
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-card-foreground">
                Canon Story
              </span>
            </div>
            <p className="text-sm text-secondary">
              A modern novel reading platform with community features and gamification.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Community
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/community/forums" className="hover:text-foreground">Forums</Link></li>
              <li><Link href="/community/events" className="hover:text-foreground">Events</Link></li>
              <li><Link href="/subscription/plans" className="hover:text-foreground">Premium</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Help & Legal
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-secondary">
            © ${currentYear} Canon Story. All rights reserved. Built with safety-first architecture.
          </p>
        </div>
      </div>
    </footer>
  )
}
`;


// --- Main Execution ---
async function main() {
    console.log('🚀 Applying UI/UX fixes and refactoring landing page...');

    // 1. Resolve route conflict and remove old landing pages
    console.log('\n--- Removing conflicting/old landing pages ---');
    await removePath('src/app/page.tsx');
    await removePath('src/app/(public)/page.tsx');

    // 2. Create new components
    console.log('\n--- Creating new components ---');
    await writeFile('src/components/shared/PlaceholderPage.tsx', placeholderPageComponentContent);
    await writeFile('src/components/discovery/BookCarousel.tsx', bookCarouselComponentContent);
    
    // 3. Create placeholder pages
    console.log('\n--- Creating placeholder pages ---');
    const placeholderPages = [
        'leaderboards', 'community/forums', 'community/events', 'subscription/plans',
        'help', 'terms', 'privacy', 'about', 'blog', 'careers', 'contact'
    ];
    for (const page of placeholderPages) {
        const pageName = page.split('/').pop().replace(/-(\w)/g, (match, p1) => p1.toUpperCase());
        const componentName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        await writeFile(`src/app/(public)/${page}/page.tsx`, placeholderPageContent(componentName));
    }

    // 4. Update Header and Footer
    console.log('\n--- Updating layout components ---');
    await writeFile('src/components/shared/layout/Header.tsx', updatedHeaderContent);
    await writeFile('src/components/shared/layout/Footer.tsx', updatedFooterContent);

    // 5. Create the new landing page
    console.log('\n--- Creating new landing page ---');
    await writeFile('src/app/(public)/page.tsx', newLandingPageContent);
    
    console.log('\n\n✅ Fix script completed successfully!');
    console.log('Summary of changes:');
    console.log('  - Removed conflicting landing pages.');
    console.log('  - Created a new, professionally designed landing page in src/app/(public)/page.tsx.');
    console.log('  - Updated Header to conditionally show an "Admin" link for admins/moderators.');
    console.log('  - Updated Footer with new navigation links.');
    console.log('  - Added multiple placeholder pages to prevent 404 errors.');
    console.log('\nPlease restart your development server to see the changes.');
}

main().catch(console.error);