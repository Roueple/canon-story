import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 md:col-span-2">
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

          {/* Discover */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Discover
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/browse" className="hover:text-foreground">Browse All</Link></li>
              <li><Link href="/genres" className="hover:text-foreground">Genres</Link></li>
              <li><Link href="/trending" className="hover:text-foreground">Trending</Link></li>
              <li><Link href="/leaderboards" className="hover:text-foreground">Leaderboards</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Community
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/authors" className="hover:text-foreground">For Authors</Link></li>
              <li><Link href="/community/forums" className="hover:text-foreground">Forums</Link></li>
              <li><Link href="/community/events" className="hover:text-foreground">Events</Link></li>
              <li><Link href="/subscription/plans" className="hover:text-foreground">Premium</Link></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-secondary">
            © {currentYear} Canon Story. All rights reserved. Built with safety-first architecture.
          </p>
        </div>
      </div>
    </footer>
  )
}