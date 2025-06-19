// src/components/admin/media/MediaModal.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Modal, Button, LoadingSpinner } from '@/components/shared/ui'
import { ImageUploader } from './ImageUploader'
import { Check, Upload, X } from 'lucide-react'

interface MediaModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: { url: string; id: string }) => void
  multiple?: boolean
}

export function MediaModal({ isOpen, onClose, onSelect, multiple = false }: MediaModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<any[]>([])
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen])

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/admin/media')
      const data = await response.json()
      setMediaItems(data.data || [])
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (media: any) => {
    if (multiple) {
      setSelectedMedia(prev => {
        const exists = prev.some(item => item.id === media.id)
        if (exists) {
          return prev.filter(item => item.id !== media.id)
        }
        return [...prev, media]
      })
    } else {
      setSelectedMedia([media])
    }
  }

  const handleConfirm = () => {
    if (selectedMedia.length > 0) {
      if (multiple) {
        // For multiple selection, you might want to handle differently
        selectedMedia.forEach(media => onSelect(media))
      } else {
        onSelect(selectedMedia[0])
      }
    }
    onClose()
  }

  const handleUploadSuccess = (media: any) => {
    setMediaItems(prev => [media, ...prev])
    setActiveTab('library')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Media Library" size="lg">
      <div className="flex flex-col h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'library'
                ? 'text-white border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Media Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'upload'
                ? 'text-white border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'library' ? (
            isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {mediaItems.map((media) => {
                  const isSelected = selectedMedia.some(item => item.id === media.id)
                  return (
                    <div
                      key={media.id}
                      onClick={() => handleSelect(media)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary ring-opacity-50'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="relative h-32 bg-gray-800">
                        <Image
                          src={media.thumbnailUrl || media.url}
                          alt={media.filename}
                          layout="fill"
                          objectFit="cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary bg-opacity-30 flex items-center justify-center">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-gray-800">
                        <p className="text-xs text-gray-300 truncate">{media.filename}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <ImageUploader onUploadSuccess={handleUploadSuccess} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedMedia.length === 0}
          >
            {selectedMedia.length > 0
              ? `Select (${selectedMedia.length})`
              : 'Select'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}