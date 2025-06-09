import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole('admin')
  } catch {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Admin Sidebar - will be implemented in Chat 3 */}
        <div className="w-64 bg-gray-950 border-r border-gray-800">
          <div className="p-4">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
