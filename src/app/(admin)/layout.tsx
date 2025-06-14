// src/app/(admin)/layout.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    console.log('No user found, redirecting to sign-in');
    redirect('/sign-in');
  }

  let dbUser = null;
  try {
    // First, try to find the user by their Clerk ID
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, displayName: true, email: true },
    });

    // If not found by ID and an email exists, try finding by email
    if (!dbUser && user.primaryEmailAddress?.emailAddress) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.primaryEmailAddress.emailAddress },
        select: { id: true, role: true, displayName: true, email: true },
      });
    }
  } catch (error) {
    console.error('Error fetching user from database:', error);
  }

  // Redirect if the user is not an admin or moderator
  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
    console.log('User is not an admin or moderator, redirecting to home');
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader
        user={{
          firstName: user.firstName,
          displayName: dbUser.displayName,
          role: dbUser.role,
        }}
      />
      <div className="flex">
        <AdminSidebar role={dbUser.role} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}