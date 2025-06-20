'use client'

import { useState } from 'react'
import { Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/shared/ui' // Corrected path

interface Props {
  novelId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface ChapterData {
  chapterNumber: number;
  title: string;
  content: string;
  isPremium?: boolean;
  isPublished?: boolean;
}

interface PreviewData {
  chapters: ChapterData[];
  conflicts: number[];
}

interface ImportResult {
  created: number;
  errors: string[];
}

export function BulkExcelImporter({ novelId, onComplete, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const response = await fetch('/api/admin/import/template');
      if (!response.ok) throw new Error('Failed to download template.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_chapter_upload_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

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
      setPreviewData(null);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select an Excel file.');
      return;
    }
    setIsProcessing(true);
    setError('');
    setPreviewData(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('novelId', novelId);

      const response = await fetch('/api/admin/import/bulk/preview', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Preview generation failed.');
      setPreviewData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.chapters.length === 0) {
      setError('No chapters to import or preview data is missing.');
      return;
    }
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/admin/import/bulk/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapters: previewData.chapters
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Import processing failed.');
      setImportResult(result.data);
      if (result.data.created > 0) {
        setTimeout(() => { onComplete(); }, 2000); // Auto-close modal on success
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-2">Step 1: Download & Fill Template</h3>
        <p className="text-sm text-gray-400 mb-3">Download the Excel template, fill it with chapter data (up to 50 chapters).</p>
        <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2" disabled={isProcessing} isLoading={isProcessing && !file && !previewData && !importResult}>
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-2">Step 2: Upload Filled Template</h3>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <input type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" id="bulk-excel-upload" disabled={isProcessing} />
          <label htmlFor="bulk-excel-upload" className="cursor-pointer block">
            <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">{file ? file.name : 'Click to select Excel file'}</p>
            <p className="text-xs text-gray-500">.xlsx format only</p>
          </label>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-md -my-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {previewData && !importResult && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Step 3: Preview Import</h3>
          {previewData.conflicts.length > 0 && (
            <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
              <p className="text-yellow-300 text-sm font-medium">
                ⚠️ Conflict Warning:
              </p>
              <p className="text-yellow-400 text-xs">
                Chapter numbers <span className="font-semibold">{previewData.conflicts.join(', ')}</span> already exist and will be SKIPPED if you proceed.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-300 mb-2">
            Found <span className="font-semibold text-white">{previewData.chapters.length}</span> chapters to import. Showing first 5:
          </p>
          <div className="overflow-x-auto rounded border border-gray-700 max-h-60">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-300">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-300">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-300">Words</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-300">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {previewData.chapters.slice(0, 5).map((ch, idx) => (
                  <tr key={idx} className={previewData.conflicts.includes(ch.chapterNumber) ? 'opacity-60 bg-yellow-900/20' : ''}>
                    <td className="px-3 py-2 text-gray-200">{ch.chapterNumber}</td>
                    <td className="px-3 py-2 text-gray-300 truncate max-w-xs">{ch.title}</td>
                    <td className="px-3 py-2 text-gray-300">{ch.content.split(/\s+/).filter(Boolean).length}</td>
                    <td className="px-3 py-2 text-gray-300">
                      {ch.isPublished && <Badge size="sm" variant="success" className="mr-1">Published</Badge>}
                      {ch.isPremium && <Badge size="sm" variant="primary" className="bg-purple-500/20 text-purple-300">Premium</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.chapters.length > 5 && <p className="text-xs text-gray-400 mt-2 text-center">...and {previewData.chapters.length - 5} more chapters.</p>}
        </div>
      )}

      {importResult && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-2">Import Result</h3>
          {importResult.created > 0 && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-md mb-2">
              <CheckCircle className="h-5 w-5" />
              <span>{importResult.created} chapters imported successfully! The page will refresh.</span>
            </div>
          )}
          {importResult.errors?.length > 0 && (
            <div className="bg-red-900/20 p-3 rounded-md">
              <p className="text-red-400 text-sm font-medium mb-1">Encountered {importResult.errors.length} errors:</p>
              <ul className="list-disc list-inside text-xs text-red-400 max-h-32 overflow-y-auto">
                {importResult.errors.map((errMsg: string, i: number) => <li key={i}>{errMsg}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>Close</Button>
        {!previewData && !importResult && (
          <Button onClick={handlePreview} disabled={!file || isProcessing} isLoading={isProcessing}>
            {isProcessing ? 'Analyzing...' : 'Preview Excel Data'}
          </Button>
        )}
        {previewData && !importResult && (
          <Button onClick={handleConfirmImport} disabled={isProcessing || previewData.chapters.length === 0} isLoading={isProcessing} variant="primary">
            {isProcessing ? 'Importing...' : `Confirm Import (${previewData.chapters.length - previewData.conflicts.length} valid)`}
          </Button>
        )}
      </div>
    </div>
  );
}