// src/components/admin/media/ImageUploader.tsx
'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, AlertCircle } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ui'

interface ImageUploaderProps {
  onUploadSuccess: (media: any) => void
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setError(null);
    const filename = file.name;

    try {
      // 1. Get signature
      const sigResponse = await fetch('/api/admin/media/signature', { method: 'POST' });
      const { data: signatureData } = await sigResponse.json();

      // 2. Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('folder', 'canon-story');

      // 3. Upload directly to Cloudinary via XHR for progress tracking
      const xhr = new XMLHttpRequest();
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
      xhr.open('POST', cloudinaryUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [filename]: progress }));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const cloudinaryResponse = JSON.parse(xhr.responseText);
          const thumbnailUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${cloudinaryResponse.public_id}`;
          
          // 4. Save metadata to our DB
          const dbResponse = await fetch('/api/admin/media', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publicId: cloudinaryResponse.public_id,
              originalName: filename,
              mimeType: file.type,
              fileSize: file.size,
              width: cloudinaryResponse.width,
              height: cloudinaryResponse.height,
              url: cloudinaryResponse.secure_url,
              thumbnailUrl,
            })
          });
          const newMediaFile = await dbResponse.json();
          onUploadSuccess(newMediaFile.data);
          setUploadProgress(prev => { const copy = {...prev}; delete copy[filename]; return copy; });
        } else {
          setError(`Upload failed for ${filename}. Please try again.`);
        }
      };
      xhr.send(formData);
    } catch (err) {
      setError('Could not prepare upload. Check server connection.');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
    multiple: true,
  });

  return (
    <div>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-300">Drag & drop images here, or click to select</p>
          <p className="text-sm text-gray-500">Multiple files are accepted.</p>
        </div>
      </div>
      {error && <p className="mt-2 text-error flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}
      <div className="mt-4 space-y-2">
        {Object.entries(uploadProgress).map(([name, progress]) => (
          <div key={name}>
            <p className="text-sm text-gray-400 mb-1">{name}</p>
            <ProgressBar value={progress} showLabel />
          </div>
        ))}
      </div>
    </div>
  );
}