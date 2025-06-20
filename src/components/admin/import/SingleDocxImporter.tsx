'use client'

import { useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/shared/ui' // Corrected path
import { useRouter } from 'next/navigation'

interface Props {
  novelId: string;
  // onComplete: () => void; // Not used if redirecting
  onCancel: () => void;
}

interface ChapterPreview {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
}

export function SingleDocxImporter({ novelId, onCancel }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ChapterPreview | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx')) {
        setError('Only DOCX files are supported (.docx)');
        setFile(null);
        setPreview(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setPreview(null); // Reset preview if file changes
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('novelId', novelId);

      const response = await fetch('/api/admin/import/preview', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Preview generation failed');
      }
      setPreview(data.data); // Assuming API returns { success: true, data: previewData }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndEdit = () => {
    if (!preview) return;
    
    // WARNING: Passing full content via query params is risky due to URL length limits.
    // For large chapters, this will fail. Consider a temporary store or re-upload on edit page.
    const params = new URLSearchParams({
      title: preview.title,
      // Pass only a snippet of content or an identifier if content is too large
      content: preview.content, // This is the risky part
      chapterNumber: preview.chapterNumber.toString(),
      fromImport: 'true'
    });
    
    router.push(`/admin/novels/${novelId}/chapters/create?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
          id="single-docx-upload"
          disabled={isProcessing}
        />
        <label htmlFor="single-docx-upload" className="cursor-pointer block">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">
            {file ? file.name : 'Click to select a DOCX file'}
          </p>
          <p className="text-sm text-gray-400">
            Filename convention: "Chapter X: Title.docx" or "X - Title.docx"
          </p>
        </label>
      </div>

      {preview && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-medium text-white">Extracted Preview</h3>
          <div className="space-y-1">
            <p><span className="text-gray-400">Chapter Number:</span> <span className="text-white">{preview.chapterNumber}</span></p>
            <p><span className="text-gray-400">Title:</span> <span className="text-white">{preview.title}</span></p>
            <p><span className="text-gray-400">Word Count:</span> <span className="text-white">{preview.wordCount.toLocaleString()}</span></p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Content Snippet:</p>
            <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto text-sm text-gray-300">
              {preview.content.substring(0, 300)}{preview.content.length > 300 ? '...' : ''}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        {!preview ? (
          <Button
            onClick={handlePreview}
            disabled={!file || isProcessing}
            isLoading={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Preview DOCX'}
          </Button>
        ) : (
          <Button onClick={handleConfirmAndEdit} variant="primary" disabled={isProcessing}>
            Confirm and Edit Chapter
          </Button>
        )}
      </div>
    </div>
  );
}