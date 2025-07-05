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
    <header className="bg-background border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-success" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Canon Story Admin</h1>
              <p className="text-sm text-secondary">
                {user.role === 'admin' ? 'Administrator' : 'Moderator'} Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-secondary hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-error rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.displayName || user.firstName || 'Admin'}
                </p>
                <p className="text-xs text-secondary">{user.role}</p>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 text-secondary hover:text-foreground transition-colors"
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