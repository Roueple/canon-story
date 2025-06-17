// src/components/admin/media/MediaModal.tsx
'use client'
import { useState } from 'react';
import { Modal } from '@/components/shared/ui';
import { ImageUploader } from './ImageUploader';
import { MediaLibrary } from './MediaLibrary';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: any) => void;
}

export function MediaModal({ isOpen, onClose, onSelect }: MediaModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = (media: any) => {
    // Automatically select the new image and close
    onSelect(media);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select or Upload Image" size="xl">
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-gray-700">
          <button onClick={() => setActiveTab('library')} className={`pb-2 px-1 text-sm font-medium ${activeTab === 'library' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Media Library</button>
          <button onClick={() => setActiveTab('upload')} className={`pb-2 px-1 text-sm font-medium ${activeTab === 'upload' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Upload New</button>
        </div>
        <div className="min-h-[400px]">
          {activeTab === 'library' && <MediaLibrary onSelect={onSelect} selectable refreshKey={refreshKey}/>}
          {activeTab === 'upload' && <ImageUploader onUploadSuccess={() => { setRefreshKey(k => k + 1); setActiveTab('library'); }} />}
        </div>
      </div>
    </Modal>
  );
}