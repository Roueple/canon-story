// create-missing-hooks.mjs
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';

console.log('🔧 Creating missing hooks...\n');

// Ensure directory exists
async function ensureDir(filePath) {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

const hooks = [
  {
    path: 'src/hooks/useImageModal.ts',
    content: `// src/hooks/useImageModal.ts
import { useEffect } from 'react'

export function useImageModal() {
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if clicked element is an image inside chapter content
      if (
        target.tagName === 'IMG' && 
        target.closest('.chapter-text-content')
      ) {
        e.preventDefault()
        
        const img = target as HTMLImageElement
        
        // Create modal overlay
        const modal = document.createElement('div')
        modal.style.cssText = \`
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          cursor: zoom-out;
          padding: 2rem;
        \`
        
        // Create modal image
        const modalImg = document.createElement('img')
        modalImg.src = img.src
        modalImg.alt = img.alt || ''
        modalImg.style.cssText = \`
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        \`
        
        // Create close button
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '×'
        closeButton.style.cssText = \`
          position: absolute;
          top: 2rem;
          right: 2rem;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 2rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        \`
        
        closeButton.onmouseover = () => {
          closeButton.style.background = 'rgba(255, 255, 255, 0.2)'
        }
        
        closeButton.onmouseout = () => {
          closeButton.style.background = 'rgba(255, 255, 255, 0.1)'
        }
        
        modal.appendChild(modalImg)
        modal.appendChild(closeButton)
        
        // Close on click
        modal.addEventListener('click', () => {
          modal.remove()
        })
        
        // Prevent image click from closing modal
        modalImg.addEventListener('click', (e) => {
          e.stopPropagation()
        })
        
        document.body.appendChild(modal)
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden'
        
        // Restore body scroll when modal closes
        modal.addEventListener('click', () => {
          document.body.style.overflow = ''
        })
      }
    }
    
    // Add click listener
    document.addEventListener('click', handleImageClick)
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleImageClick)
      document.body.style.overflow = ''
    }
  }, [])
}`
  },
  {
    path: 'src/hooks/useReadingProgress.ts',
    content: `// src/hooks/useReadingProgress.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { debounce } from 'lodash'

interface ReadingProgress {
  novelId: string
  chapterId: string
  progressPercentage: number
  scrollPosition: number
  lastReadAt: Date
}

export function useReadingProgress(novelId?: string, chapterId?: string) {
  const { isSignedIn, userId } = useAuth()
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current progress
  useEffect(() => {
    if (!isSignedIn || !userId || !novelId) {
      setProgress(null)
      return
    }

    const fetchProgress = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(\`/api/public/users/progress?novelId=\${novelId}\`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch reading progress')
        }
        
        const data = await response.json()
        setProgress(data.data || null)
      } catch (err) {
        console.error('Error fetching reading progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch progress')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [isSignedIn, userId, novelId])

  // Debounced update function
  const updateProgressDebounced = useCallback(
    debounce(async (percentage: number, scrollPos?: number) => {
      if (!isSignedIn || !userId || !novelId || !chapterId) return

      try {
        const response = await fetch('/api/public/users/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId,
            chapterId,
            progressPercentage: Math.round(percentage),
            scrollPosition: scrollPos || 0
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update reading progress')
        }

        const data = await response.json()
        setProgress(data.data)
      } catch (err) {
        console.error('Error updating reading progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to update progress')
      }
    }, 1000), // Debounce for 1 second
    [isSignedIn, userId, novelId, chapterId]
  )

  // Update progress
  const updateProgress = useCallback((percentage: number, scrollPos?: number) => {
    // Update local state immediately
    if (progress) {
      setProgress({
        ...progress,
        progressPercentage: Math.round(percentage),
        scrollPosition: scrollPos || progress.scrollPosition
      })
    }
    
    // Debounced API update
    updateProgressDebounced(percentage, scrollPos)
  }, [progress, updateProgressDebounced])

  // Get progress for specific chapter
  const getChapterProgress = useCallback((targetChapterId: string): number => {
    if (!progress || progress.chapterId !== targetChapterId) return 0
    return progress.progressPercentage
  }, [progress])

  return {
    progress,
    isLoading,
    error,
    updateProgress,
    getChapterProgress
  }
}`
  },
  {
    path: 'src/hooks/useReadingSettings.ts',
    content: `// src/hooks/useReadingSettings.ts
import { useState, useEffect, useCallback } from 'react'

interface ReadingSettings {
  fontSize: number
  lineHeight: number
  fontFamily: string
  autoScrollSpeed: number
  theme: 'light' | 'dark' | 'sepia'
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'sans-serif',
  autoScrollSpeed: 1,
  theme: 'light'
}

const STORAGE_KEY = 'canon-story-reading-settings'

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS)
  const [isSettingsReady, setIsSettingsReady] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (error) {
      console.error('Error loading reading settings:', error)
    } finally {
      setIsSettingsReady(true)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: ReadingSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Error saving reading settings:', error)
    }
  }, [])

  // Update specific setting
  const updateSetting = useCallback(<K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K]
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value }
      saveSettings(updated)
      return updated
    })
  }, [saveSettings])

  // Convenience methods
  const updateFontSize = useCallback((size: number) => {
    updateSetting('fontSize', Math.max(12, Math.min(32, size)))
  }, [updateSetting])

  const updateLineHeight = useCallback((height: number) => {
    updateSetting('lineHeight', Math.max(1.2, Math.min(3, height)))
  }, [updateSetting])

  const updateFontFamily = useCallback((family: string) => {
    updateSetting('fontFamily', family)
  }, [updateSetting])

  const updateAutoScrollSpeed = useCallback((speed: number) => {
    updateSetting('autoScrollSpeed', Math.max(0.1, Math.min(10, speed)))
  }, [updateSetting])

  const updateTheme = useCallback((theme: 'light' | 'dark' | 'sepia') => {
    updateSetting('theme', theme)
  }, [updateSetting])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
  }, [saveSettings])

  return {
    ...settings,
    isSettingsReady,
    updateFontSize,
    updateLineHeight,
    updateFontFamily,
    updateAutoScrollSpeed,
    updateTheme,
    updateSetting,
    resetSettings
  }
}`
  }
];

// Create all hooks
async function createHooks() {
  let successCount = 0;
  let errorCount = 0;

  for (const hook of hooks) {
    try {
      await ensureDir(hook.path);
      await writeFile(hook.path, hook.content, 'utf8');
      console.log(`✅ Created: ${hook.path}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error creating ${hook.path}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} hooks`);
  console.log(`❌ Errors: ${errorCount} hooks`);

  if (errorCount === 0) {
    console.log('\n🎉 All missing hooks created!');
    console.log('\n📋 Hooks created:');
    console.log('1. useImageModal - Click images to view in fullscreen');
    console.log('2. useReadingProgress - Track reading progress');
    console.log('3. useReadingSettings - Manage font size, theme, etc.');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Install lodash if not already installed:');
    console.log('   npm install lodash @types/lodash');
    console.log('2. The build error should now be resolved');
    console.log('3. Run: npm run dev');
  }
}

// Check if lodash is installed
async function checkDependencies() {
  try {
    const packageJson = await readFile('package.json', 'utf8');
    const pkg = JSON.parse(packageJson);
    
    if (!pkg.dependencies?.lodash) {
      console.log('\n⚠️  Note: lodash is required for useReadingProgress');
      console.log('Run: npm install lodash @types/lodash');
    }
  } catch (error) {
    console.log('\n⚠️  Could not check package.json');
  }
}

// Run
(async () => {
  await createHooks();
  await checkDependencies();
})();