'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from './theme-provider'

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: theme === 'reading' ? '#D97706' : '#2563EB',
          colorBackground: 'var(--background)',
          colorText: 'var(--foreground)',
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}
