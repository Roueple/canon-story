'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from './theme-provider'

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  // Define actual color values for each theme
  const themeColors = {
    light: {
      primary: '#2563EB',
      background: '#FFFFFF',
      text: '#1F2937',
    },
    dark: {
      primary: '#3B82F6',
      background: '#111827',
      text: '#F9FAFB',
    },
    reading: {
      primary: '#D97706',
      background: '#FEF3C7',
      text: '#92400E',
    }
  }
  
  const currentColors = themeColors[theme] || themeColors.light
  
  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: currentColors.primary,
          colorBackground: currentColors.background,
          colorText: currentColors.text,
          colorTextOnPrimaryBackground: '#FFFFFF',
          colorTextSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          colorInputBackground: theme === 'dark' ? '#1F2937' : '#FFFFFF',
          colorInputText: currentColors.text,
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: currentColors.primary,
            '&:hover': {
              backgroundColor: theme === 'dark' ? '#2563EB' : '#1D4ED8',
            }
          },
          card: {
            backgroundColor: currentColors.background,
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
          },
          headerTitle: {
            color: currentColors.text,
          },
          headerSubtitle: {
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          },
          socialButtonsBlockButton: {
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            '&:hover': {
              backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
            }
          },
          formFieldLabel: {
            color: currentColors.text,
          },
          formFieldInput: {
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            color: currentColors.text,
            '&:focus': {
              borderColor: currentColors.primary,
            }
          },
          footerActionLink: {
            color: currentColors.primary,
            '&:hover': {
              color: theme === 'dark' ? '#60A5FA' : '#1D4ED8',
            }
          }
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}