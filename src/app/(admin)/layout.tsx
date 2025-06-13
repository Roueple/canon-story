// src/app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current user from Clerk
  const user = await currentUser()
  
  if (!user) {
    console.log('No user found, redirecting to sign-in')
    redirect('/sign-in')
  }

  // Check if user exists in database and has admin role
  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, displayName: true, email: true }
    })
    
    console.log('Database user:', dbUser)
  } catch (error) {
    console.error('Error fetching user from database:', error)
  }

  // If user doesn't exist in database, try by email
  if (!dbUser && user.primaryEmailAddress?.emailAddress) {
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: user.primaryEmailAddress.emailAddress },
        select: { id: true, role: true, displayName: true, email: true }
      })
      console.log('Database user by email:', dbUser)
    } catch (error) {
      console.error('Error fetching user by email:', error)
    }
  }

  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
    console.log('User is not admin/moderator, redirecting to home')
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader user={{ 
        firstName: user.firstName,
        displayName: dbUser.displayName,
        role: dbUser.role 
      }} />
      <div className="flex">
        <AdminSidebar role={dbUser.role} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}