// src/app/(public)/layout.tsx
import { Header } from '@/components/shared/layout/Header'
import { Footer } from '@/components/shared/layout/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}