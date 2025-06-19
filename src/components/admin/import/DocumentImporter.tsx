// src/components/admin/import/DocumentImporter.tsx
'use client'

import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/ui'

interface DocumentImporterProps {
  novelId: string
  onComplete?: () => void
  onCancel?: () => void
}

export function DocumentImporter({ novelId, onComplete, onCancel }: DocumentImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle')
  
  const [settings, setSettings] = useState({
    chapterNumberStart: 1,
    importAsPublished: false,
    importAsPremium: false,
    splitByHeading: true,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile)
      setError(null)
    } else {
      setError('Please select a valid DOCX file')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setStatus('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('novelId', novelId)
    formData.append('settings', JSON.stringify(settings))

    try {
      const response = await fetch('/api/admin/import/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { data } = await response.json()
      setImportId(data.importId)
      setStatus('processing')
      
      // Poll for import status
      pollImportStatus(data.importId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('failed')
      setIsUploading(false)
    }
  }

  const pollImportStatus = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/import/status/${id}`)
        const { data } = await response.json()

        if (data.progress) {
          setProgress(data.progress)
        }

        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setStatus('completed')
          setIsUploading(false)
          setTimeout(() => {
            onComplete?.()
          }, 2000)
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setError(data.errorMessage || 'Import failed')
          setStatus('failed')
          setIsUploading(false)
        }
      } catch (err) {
        clearInterval(pollInterval)
        setError('Failed to check import status')
        setStatus('failed')
        setIsUploading(false)
      }
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
          id="docx-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="docx-upload"
          className="cursor-pointer block"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">
            {file ? file.name : 'Click to select a DOCX file'}
          </p>
          <p className="text-sm text-gray-400">
            Maximum file size: 25MB
          </p>
        </label>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Import Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Starting Chapter Number
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={settings.chapterNumberStart}
            onChange={(e) => setSettings({ ...settings, chapterNumberStart: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.importAsPublished}
              onChange={(e) => setSettings({ ...settings, importAsPublished: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-300">Import as published</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.importAsPremium}
              onChange={(e) => setSettings({ ...settings, importAsPremium: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-300">Import as premium chapters</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.splitByHeading}
              onChange={(e) => setSettings({ ...settings, splitByHeading: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-300">Split into chapters by headings</span>
          </label>
        </div>
      </div>

      {/* Progress */}
      {status === 'processing' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Processing chapters...</span>
            <span className="text-white">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-md">
          <CheckCircle className="h-5 w-5" />
          <span>Import completed successfully!</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          isLoading={isUploading}
        >
          {isUploading ? 'Processing...' : 'Import Chapters'}
        </Button>
      </div>
    </div>
  )
}