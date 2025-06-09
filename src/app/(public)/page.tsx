import { auth } from '@clerk/nextjs/server'
import { BookOpen, Users, Trophy, Sparkles, Shield, Database } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/shared/ui'

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Welcome to Canon Story
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-secondary sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              A modern novel reading platform with community features, gamification, and an immersive reading experience.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              {userId ? (
                <Link href="/novels">
                  <Button size="lg">Browse Novels</Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="outline">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Rich Content</h3>
              <p className="mt-2 text-sm text-secondary">
                Support for chapters, images, and formatted text
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Gamification</h3>
              <p className="mt-2 text-sm text-secondary">
                Achievements, levels, and customization rewards
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Community</h3>
              <p className="mt-2 text-sm text-secondary">
                Comments, reviews, and social features
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Premium</h3>
              <p className="mt-2 text-sm text-secondary">
                Exclusive content and enhanced features
              </p>
            </div>
          </div>

          {/* Safety Features */}
          <div className="mt-16 rounded-lg bg-card p-8 border border-border">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-success mr-3" />
              <h2 className="text-2xl font-bold text-card-foreground">Built with Safety in Mind</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start">
                <Database className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Neon Database Branching</h3>
                  <p className="text-sm text-secondary">Create database snapshots before any risky operations</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Soft Deletes</h3>
                  <p className="text-sm text-secondary">Nothing is permanently deleted - recover data anytime</p>
                </div>
              </div>
              <div className="flex items-start">
                <Database className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">No Cascade Deletes</h3>
                  <p className="text-sm text-secondary">Protected against accidental data loss</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Audit Trail</h3>
                  <p className="text-sm text-secondary">Complete history of all data changes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
