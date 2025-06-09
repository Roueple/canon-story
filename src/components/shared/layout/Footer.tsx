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

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Discover
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link href="/novels" className="hover:text-foreground">
                  All Novels
                </Link>
              </li>
              <li>
                <Link href="/genres" className="hover:text-foreground">
                  Genres
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-foreground">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/leaderboards" className="hover:text-foreground">
                  Leaderboards
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Community
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link href="/community/forums" className="hover:text-foreground">
                  Forums
                </Link>
              </li>
              <li>
                <Link href="/community/events" className="hover:text-foreground">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/subscription/plans" className="hover:text-foreground">
                  Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link href="/help" className="hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-secondary">
            Â© {currentYear} Canon Story. All rights reserved. Built with safety-first architecture.
          </p>
        </div>
      </div>
    </footer>
  )
}
