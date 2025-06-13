// src/components/admin/AdminHeader.tsx
'use client'

import { Bell, LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'

interface AdminHeaderProps {
  user: {
    firstName?: string | null
    displayName?: string | null
    role: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Canon Story Admin</h1>
              <p className="text-sm text-gray-400">
                {user.role === 'admin' ? 'Administrator' : 'Moderator'} Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user.displayName || user.firstName || 'Admin'}
                </p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}