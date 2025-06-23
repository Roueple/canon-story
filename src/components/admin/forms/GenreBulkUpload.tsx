'use client'

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/shared/ui';

interface GenreBulkUploadProps {
  onComplete: () => void;
}

export function GenreBulkUpload({ onComplete }: GenreBulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Only Excel (.xlsx) files are supported.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };
  
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
        const response = await fetch('/api/admin/content/genres/template');
        if (!response.ok) throw new Error("Failed to download template.");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "genre_upload_template.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch(err) {
        setError(err instanceof Error ? err.message : "Download failed");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel file.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/content/genres/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Bulk upload failed.');
      }
      
      setResult(data.data);
      onComplete(); // Triggers a refresh on the parent page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Instructions</h3>
        <ul className="list-disc list-inside text-sm text-gray-400 mt-2 space-y-1">
          <li>Download the template file to see the required format.</li>
          <li>Your Excel file must contain a header row.</li>
          <li>Required column: <strong>name</strong></li>
          <li>Optional columns: <strong>description</strong>, <strong>color</strong> (hex code, e.g., #EF4444)</li>
          <li>The system will automatically skip any genres where the name already exists.</li>
        </ul>
        <Button onClick={handleDownloadTemplate} isLoading={isDownloading} disabled={isDownloading} variant="outline" size="sm" className="mt-3 gap-2">
            <Download className="h-4 w-4" />
            Download Template
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          className="hidden"
          id="genre-bulk-upload"
          disabled={isLoading}
        />
        <label htmlFor="genre-bulk-upload" className="cursor-pointer block">
          <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">{file ? file.name : 'Click to select Excel file'}</p>
          <p className="text-xs text-gray-500">.xlsx format only</p>
        </label>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-md">
          <CheckCircle className="h-5 w-5" />
          <span>
            Upload complete! Created: {result.created}, Skipped: {result.skipped} (duplicates).
          </span>
        </div>
      )}
      
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <Button
          onClick={handleUpload}
          disabled={!file || isLoading}
          isLoading={isLoading}
          variant="primary"
        >
          {isLoading ? 'Processing...' : 'Upload and Process'}
        </Button>
      </div>
    </div>
  );
}