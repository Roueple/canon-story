import { BookOpen, Users, Trophy, Sparkles, Shield, Database } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Canon Story</span>
            </div>
            <nav className="flex items-center space-x-4">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to Canon Story
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              A modern novel reading platform with community features, gamification, and an immersive reading experience.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Rich Content</h3>
              <p className="mt-2 text-sm text-gray-500">
                Support for chapters, images, and formatted text
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-purple-600 text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Gamification</h3>
              <p className="mt-2 text-sm text-gray-500">
                Achievements, levels, and customization rewards
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-green-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Community</h3>
              <p className="mt-2 text-sm text-gray-500">
                Comments, reviews, and social features
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-yellow-600 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Premium</h3>
              <p className="mt-2 text-sm text-gray-500">
                Exclusive content and enhanced features
              </p>
            </div>
          </div>

          {/* Safety Features */}
          <div className="mt-16 rounded-lg bg-gray-50 p-8">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Built with Safety in Mind</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start">
                <Database className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Neon Database Branching</h3>
                  <p className="text-sm text-gray-600">Create database snapshots before any risky operations</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Soft Deletes</h3>
                  <p className="text-sm text-gray-600">Nothing is permanently deleted - recover data anytime</p>
                </div>
              </div>
              <div className="flex items-start">
                <Database className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">No Cascade Deletes</h3>
                  <p className="text-sm text-gray-600">Protected against accidental data loss</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Audit Trail</h3>
                  <p className="text-sm text-gray-600">Complete history of all data changes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Project Status</h2>
            <p className="mt-2 text-sm text-gray-600">
              ✅ Next.js 14 with TypeScript and Tailwind CSS initialized<br />
              ✅ Folder structure created<br />
              ✅ Database schema defined with Prisma<br />
              ✅ Using Neon PostgreSQL with branching support<br />
              ✅ Soft delete system implemented<br />
              ✅ Safe deletion strategies (no cascading deletes)<br />
              ✅ Audit logging and backup systems ready<br />
              ✅ Basic utilities and types configured<br />
              🚧 Authentication setup pending<br />
              🚧 API routes pending
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm text-green-800">
                  <strong>Database:</strong> Connected to Neon PostgreSQL with branching
                </p>
              </div>
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Safety:</strong> Soft deletes + No cascade + Audit trail
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}