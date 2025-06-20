// implement-upload-features.js
import fs from 'fs/promises';
import path from 'path';

const filesToCreate = [
  {
    path: 'src/services/documentImportService.ts',
    content: `
import { prisma } from '@/lib/db';
import mammoth from 'mammoth';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Prisma } from '@prisma/client'; // Added for Prisma.Decimal
import type { ChapterStatus } from '@/types'; // Added for ChapterStatus type

// Cloudinary config is not used in this simplified version, 
// but can be added back if DOCX files are to be stored in Cloudinary first
// import { v2 as cloudinary } from 'cloudinary';
// cloudinary.config({ /* ... */ });

interface ExtractedChapterInfo {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
}

interface BulkChapterData {
  chapterNumber: number;
  title: string;
  content: string;
  isPremium?: boolean;
  isPublished?: boolean;
}

export const documentImportService = {
  extractChapterInfoFromFilename(filename: string): { number: number | null; title: string } {
    const pattern = /Chapter\\s+(\\d+(?:\\.\\d+)?)\\s*[:|-]\\s*(.+?)(?:\\.\\w+)?$/i;
    const match = filename.match(pattern);
    
    if (match) {
      return {
        number: parseFloat(match[1]),
        title: match[2].trim()
      };
    }
    // Fallback: try to get a number if "Chapter X" is not present but a number is
    const simpleNumberPattern = /^(\\d+(?:\\.\\d+)?)[\\s:_-]+(.+?)(?:\\.\\w+)?$/;
    const simpleMatch = filename.match(simpleNumberPattern);
    if (simpleMatch) {
        return {
            number: parseFloat(simpleMatch[1]),
            title: simpleMatch[2].trim()
        };
    }
    
    return { number: null, title: filename.replace(/\\.\\w+$/, '') };
  },

  async parseSingleDocx(buffer: Buffer, filename: string): Promise<ExtractedChapterInfo> {
    const result = await mammoth.convertToHtml({ buffer });
    let { number, title } = this.extractChapterInfoFromFilename(filename);
    
    const content = result.value.trim(); // Keep original spacing, HTML handles collapse
    
    const wordCount = content.split(/\\s+/).filter(word => word.length > 0).length;
    
    return {
      chapterNumber: number || 1, // Default to 1 if not found
      title,
      content,
      wordCount
    };
  },

  async createImportPreview(
    buffer: Buffer,
    filename: string,
    novelId: string
  ): Promise<ExtractedChapterInfo> {
    const chapterInfo = await this.parseSingleDocx(buffer, filename);
    
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        novelId,
        chapterNumber: new Prisma.Decimal(chapterInfo.chapterNumber),
        isDeleted: false // Use isDeleted instead of deletedAt
      }
    });
    
    if (existingChapter) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { novelId, isDeleted: false },
        orderBy: { chapterNumber: 'desc' },
        select: { chapterNumber: true }
      });
      chapterInfo.chapterNumber = (lastChapter ? Number(lastChapter.chapterNumber) : 0) + 1;
    }
    
    return chapterInfo;
  },

  generateBulkUploadTemplate(): Buffer {
    const wb = XLSX.utils.book_new();
    const instructions = [
      ['Bulk Chapter Upload Template Instructions'],
      [''],
      ['Sheet: "Chapters" - Required Columns:'],
      ['1. Chapter Number: Numeric (e.g., 1, 1.5, 2.1). Required.'],
      ['2. Title: Text. Required.'],
      ['3. Content: Text (can include basic HTML). Required.'],
      ['4. Is Premium: TRUE/FALSE (default: FALSE). Optional.'],
      ['5. Is Published: TRUE/FALSE (default: FALSE). Optional.'],
      [''],
      ['Notes:'],
      ['- Maximum 50 chapters per upload.'],
      ['- Save this file as .xlsx format to upload.'],
      ['- Do not change the sheet name "Chapters".']
    ];
    const ws_instructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, ws_instructions, 'Instructions');
    
    const chapters_data = [
      ['Chapter Number', 'Title', 'Content', 'Is Premium', 'Is Published'],
      [1, 'Example Chapter One', '<p>This is the content for chapter one.</p>', 'FALSE', 'FALSE'],
      [1.5, 'Example Interlude', '<p>Content for an interlude or side story.</p>', 'FALSE', 'TRUE'],
      [2, 'Example Chapter Two', '<p>Chapter two content <strong>with bold</strong> and <em>italics</em>.</p>', 'TRUE', 'TRUE']
    ];
    const ws_chapters = XLSX.utils.aoa_to_sheet(chapters_data);
    ws_chapters['!cols'] = [ {wch: 15}, {wch: 40}, {wch: 80}, {wch: 12}, {wch: 12} ];
    XLSX.utils.book_append_sheet(wb, ws_chapters, 'Chapters');
    
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  },

  async parseBulkUploadFile(buffer: Buffer): Promise<BulkChapterData[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Chapters'];
    if (!sheet) throw new Error('No "Chapters" sheet found in the Excel file.');
    
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
    const chapters: BulkChapterData[] = [];
    const errors: string[] = [];
    
    jsonData.forEach((row, index) => {
      const rowNum = index + 2;
      const chapterNumber = row['Chapter Number'];
      const title = row['Title'];
      const content = row['Content'];

      if (chapterNumber == null || title == null || content == null) {
        errors.push(\`Row \${rowNum}: Missing Chapter Number, Title, or Content.\`);
        return;
      }
      if (typeof parseFloat(chapterNumber) !== 'number' || isNaN(parseFloat(chapterNumber))) {
        errors.push(\`Row \${rowNum}: Chapter Number must be a valid number.\`);
        return;
      }
      if (typeof title !== 'string' || title.trim() === '') {
        errors.push(\`Row \${rowNum}: Title must be a non-empty string.\`);
        return;
      }
       if (typeof content !== 'string' || content.trim() === '') {
        errors.push(\`Row \${rowNum}: Content must be a non-empty string.\`);
        return;
      }

      chapters.push({
        chapterNumber: parseFloat(chapterNumber),
        title: title.toString().trim(),
        content: content.toString().trim(),
        isPremium: row['Is Premium']?.toString().toUpperCase() === 'TRUE',
        isPublished: row['Is Published']?.toString().toUpperCase() === 'TRUE'
      });
    });
    
    if (errors.length > 0) throw new Error(\`Validation errors:\\n\${errors.join('\\n')}\`);
    if (chapters.length === 0) throw new Error('No valid chapters found in the file.');
    if (chapters.length > 50) throw new Error('Maximum 50 chapters allowed per bulk upload.');
    
    return chapters;
  },

  async createBulkImportPreview(
    chapters: BulkChapterData[],
    novelId: string
  ): Promise<{ chapters: BulkChapterData[]; conflicts: number[] }> {
    const chapterNumbers = chapters.map(ch => new Prisma.Decimal(ch.chapterNumber));
    const existingChapters = await prisma.chapter.findMany({
      where: {
        novelId,
        chapterNumber: { in: chapterNumbers },
        isDeleted: false
      },
      select: { chapterNumber: true }
    });
    const conflicts = existingChapters.map(ch => Number(ch.chapterNumber));
    return { chapters, conflicts };
  },

  async processBulkImport(
    chapters: BulkChapterData[],
    novelId: string
    // Removed userId as it's not in Chapter schema
  ): Promise<{ created: number; errors: string[] }> {
    let createdCount = 0;
    const errorMessages: string[] = [];
    
    for (const chapter of chapters) {
      try {
        const slug = generateSlug(chapter.title);
        const wordCount = chapter.content.split(/\\s+/).filter(w => w.length > 0).length;
        const estimatedReadTime = calculateReadingTime(wordCount);
        
        let chapterStatus: ChapterStatus = 'draft';
        if (chapter.isPublished) {
          chapterStatus = chapter.isPremium ? 'premium' : 'free';
        }

        await prisma.chapter.create({
          data: {
            novelId,
            chapterNumber: new Prisma.Decimal(chapter.chapterNumber),
            title: chapter.title,
            slug,
            content: chapter.content,
            wordCount,
            estimatedReadTime,
            status: chapterStatus,
            isPublished: chapter.isPublished ?? false,
            isPremium: chapter.isPremium ?? false,
            displayOrder: new Prisma.Decimal(chapter.chapterNumber * 10),
            publishedAt: (chapter.isPublished ?? false) ? new Date() : null
            // removed createdBy, updatedBy
          }
        });
        createdCount++;
      } catch (error: any) {
        errorMessages.push(\`Chapter \${chapter.chapterNumber} (\${chapter.title}): \${error.message}\`);
      }
    }
    // Update novel's updatedAt timestamp
    if (createdCount > 0) {
        await prisma.novel.update({
            where: { id: novelId },
            data: { updatedAt: new Date() }
        });
    }
    return { created: createdCount, errors: errorMessages };
  }
}
`
  },
  {
    path: 'src/components/admin/import/SingleDocxImporter.tsx',
    content: `
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
    
    router.push(\`/admin/novels/\${novelId}/chapters/create?\${params.toString()}\`);
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
`
  },
  {
    path: 'src/components/admin/import/BulkExcelImporter.tsx',
    content: `
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
                    <td className="px-3 py-2 text-gray-300">{ch.content.split(/\\s+/).filter(Boolean).length}</td>
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
            {isProcessing ? 'Importing...' : \`Confirm Import (\${previewData.chapters.length - previewData.conflicts.length} valid)\`}
          </Button>
        )}
      </div>
    </div>
  );
}
`
  },
  {
    path: 'src/components/admin/import/ImportModal.tsx',
    content: `
'use client'

import { useState } from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { Modal } from '@/components/shared/ui' // Corrected path
import { SingleDocxImporter } from './SingleDocxImporter'
import { BulkExcelImporter } from './BulkExcelImporter'

interface Props {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
  onImportComplete: () => void; // Renamed for clarity
}

export function ImportModal({ isOpen, onClose, novelId, onImportComplete }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk' | null>(null);

  const handleModalClose = () => {
    setMode(null); // Reset mode when modal closes
    onClose();
  };
  
  const handleActualImportCompletion = () => {
    setMode(null); // Reset mode
    onImportComplete(); // Call the prop to refresh chapter list etc.
    // Optionally close modal here, or let ImportComplete handle it
    // onClose(); 
  };

  const handleCancelSubComponent = () => {
    setMode(null); // Go back to selection screen
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={mode ? (mode === 'single' ? "Import Single DOCX" : "Bulk Import from Excel") : "Choose Import Method"}
      size={mode ? "lg" : "md"} // Larger modal for importer views
    >
      {!mode ? (
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('single')}
            className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left flex flex-col items-center md:items-start"
          >
            <FileText className="h-10 w-10 text-primary mb-3" />
            <h3 className="text-md font-semibold text-white mb-1">Single DOCX Import</h3>
            <p className="text-xs text-gray-400">Import one chapter from a DOCX file. Preview and edit details before saving.</p>
          </button>
          
          <button
            onClick={() => setMode('bulk')}
            className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left flex flex-col items-center md:items-start"
          >
            <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
            <h3 className="text-md font-semibold text-white mb-1">Bulk Excel Import</h3>
            <p className="text-xs text-gray-400">Import up to 50 chapters at once using our Excel template.</p>
          </button>
        </div>
      ) : mode === 'single' ? (
        <SingleDocxImporter
          novelId={novelId}
          onCancel={handleCancelSubComponent}
          // onComplete is handled by redirecting to chapter create/edit page
        />
      ) : (
        <BulkExcelImporter
          novelId={novelId}
          onComplete={handleActualImportCompletion} // This will refresh the chapter list
          onCancel={handleCancelSubComponent}
        />
      )}
    </Modal>
  );
}
`
  },
  {
    path: 'src/app/api/admin/import/preview/route.ts', // For single DOCX preview
    content: `
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { documentImportService } from '@/services/documentImportService'

export const POST = createAdminRoute(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const novelId = formData.get('novelId') as string;

    if (!file) return errorResponse('No file provided.', 400);
    if (!novelId) return errorResponse('Novel ID is required.', 400);
    if (!file.name.endsWith('.docx')) return errorResponse('Invalid file type. Only .docx is supported.', 400);
    
    // Add file size validation (e.g., 10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        return errorResponse(\`File size exceeds limit of \${MAX_SIZE / (1024*1024)}MB.\`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = await documentImportService.createImportPreview(
      buffer,
      file.name,
      novelId
    );

    return successResponse(preview);
  } catch (error) {
    return handleApiError(error);
  }
});
`
  },
  {
    path: 'src/app/api/admin/import/template/route.ts', // For Excel template download
    content: `
import { NextRequest } from 'next/server'; // Keep NextRequest for consistency
import { createAdminRoute } from '@/lib/api/middleware';
import { documentImportService } from '@/services/documentImportService';
import { NextResponse } from 'next/server';

export const GET = createAdminRoute(async (req) => { // req is available if needed later
  try {
    const buffer = documentImportService.generateBulkUploadTemplate();
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="bulk_chapter_upload_template.xlsx"');

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error("Error generating template:", error);
    return NextResponse.json({ success: false, error: "Failed to generate template." }, { status: 500 });
  }
});
`
  },
  {
    path: 'src/app/api/admin/import/bulk/preview/route.ts', // For Excel bulk preview
    content: `
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const novelId = formData.get('novelId') as string;

    if (!file) return errorResponse('No file provided.', 400);
    if (!novelId) return errorResponse('Novel ID is required.', 400);
    if (!file.name.endsWith('.xlsx')) return errorResponse('Invalid file type. Only .xlsx is supported.', 400);

    // Add file size validation (e.g., 5MB limit for Excel)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        return errorResponse(\`File size exceeds limit of \${MAX_SIZE / (1024*1024)}MB.\`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const chapters = await documentImportService.parseBulkUploadFile(buffer);
    const preview = await documentImportService.createBulkImportPreview(chapters, novelId);

    return successResponse(preview);
  } catch (error) {
    return handleApiError(error);
  }
});
`
  },
  {
    path: 'src/app/api/admin/import/bulk/process/route.ts', // For Excel bulk processing
    content: `
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req, { user }) => { // user is available if needed for audit logs etc.
  try {
    const { novelId, chapters } = await req.json();

    if (!novelId || !chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return errorResponse('Invalid request data: novelId and a non-empty chapters array are required.', 400);
    }
    if (chapters.length > 50) {
        return errorResponse('Cannot process more than 50 chapters in a single bulk import.', 400);
    }

    const result = await documentImportService.processBulkImport(
      chapters,
      novelId
      // userId if you add createdBy/updatedBy to Chapter schema
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
`
  },
  {
    path: 'src/app/api/admin/chapters/reorder/route.ts',
    content: `
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const POST = createAdminRoute(async (req) => {
  try {
    const { novelId, chapterOrder } = await req.json() as { novelId: string, chapterOrder: Array<{ id: string; displayOrder: number }> };

    if (!novelId || !chapterOrder || !Array.isArray(chapterOrder)) {
      return errorResponse('Invalid request data: novelId and chapterOrder array are required.', 400);
    }
    if (chapterOrder.length === 0) {
        return successResponse({ message: 'No chapters to reorder.' });
    }

    // Validate chapterOrder data
    for (const item of chapterOrder) {
        if (typeof item.id !== 'string' || typeof item.displayOrder !== 'number') {
            return errorResponse('Invalid item in chapterOrder array. Each item must have id (string) and displayOrder (number).', 400);
        }
    }
    
    // Use a transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      chapterOrder.map(update =>
        prisma.chapter.update({
          where: { id: update.id, novelId: novelId }, // Ensure chapter belongs to the novel
          data: { displayOrder: new Prisma.Decimal(update.displayOrder) }
        })
      )
    );
    
    // Update novel's updatedAt timestamp
    await prisma.novel.update({
        where: { id: novelId },
        data: { updatedAt: new Date() }
    });

    return successResponse({ message: 'Chapters reordered successfully.' });
  } catch (error) {
    // Prisma's P2025 error for "Record to update not found" can occur if a chapterId is invalid or doesn't belong to novelId
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return errorResponse('One or more chapters not found or do not belong to the specified novel.', 404);
    }
    return handleApiError(error);
  }
});
`
  }
];

async function createDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  } catch (error) {
    if (error.code !== 'EEXIST') { // Ignore if directory already exists
      console.error(`❌ Error creating directory ${dirPath}:`, error);
      throw error;
    } else {
      console.log(`☑️ Directory already exists: ${dirPath}`);
    }
  }
}

async function createFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content.trim());
    console.log(`📝 Created/Updated file: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating file ${filePath}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting Canon Story Document Upload Feature Implementation...");

  for (const fileDef of filesToCreate) {
    const dir = path.dirname(fileDef.path);
    await createDir(dir);
    await createFile(fileDef.path, fileDef.content);
  }

  console.log("\n✅ File generation complete!");
  console.log("--------------------------------------------------");
  console.log("📋 Next Steps & Important Manual Changes:");
  console.log("--------------------------------------------------");
  console.log("1. Run 'npm install xlsx' if you haven't already.");
  console.log("2. Update 'src/app/(admin)/admin/novels/[id]/chapters/page.tsx':");
  console.log("   - Import 'ImportModal': import { ImportModal } from '@/components/admin/import/ImportModal';");
  console.log("   - Manage modal state: const [showImportModal, setShowImportModal] = useState(false);");
  console.log("   - Change the 'Import DOCX' button's onClick to: () => setShowImportModal(true)");
  console.log("   - Add the modal component to the JSX:");
  console.log("     <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} novelId={novel.id} onImportComplete={fetchNovel} />");
  console.log("3. Update 'src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx':");
  console.log("   - Import 'useSearchParams': import { useSearchParams } from 'next/navigation';");
  console.log("   - Inside the component: const searchParams = useSearchParams();");
  console.log("   - Create 'initialDataFromImport' based on searchParams (see detailed instructions below).");
  console.log("   - Pass this 'initialDataFromImport' to the <ChapterForm initialData={initialDataFromImport} />.");
  console.log("4. Review all created/updated files, especially 'documentImportService.ts', for any project-specific adjustments.");
  console.log("5. Ensure your Prisma 'Chapter' model aligns with fields used (e.g., 'estimatedReadTime', 'status' (draft, free, premium)).");
  console.log("6. Test thoroughly!");
  console.log("   - Single DOCX import flow.");
  console.log("   - Bulk Excel import flow (download template, fill, upload, preview, process).");
  console.log("   - Error handling for invalid files or data.");
  console.log("\n✨ Detailed change for 'src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx':");
  console.log(`
  // At the top of CreateChapterPage component in src/app/(admin)/admin/novels/[id]/chapters/create/page.tsx
  import { useSearchParams } from 'next/navigation'; // Make sure this import is added

  // Inside the CreateChapterPage component function:
  const searchParams = useSearchParams();
  const initialDataFromImport = searchParams.get('fromImport') === 'true'
    ? {
        title: searchParams.get('title') || '',
        content: searchParams.get('content') || '', // Be mindful of URL length limits here
        chapterNumber: parseFloat(searchParams.get('chapterNumber') || '1'),
        status: 'draft', // Default status for imported chapters before editing
        isPublished: false,
      }
    : undefined;

  // Then, in the <ChapterForm ... /> component:
  // <ChapterForm
  //   ...
  //   initialData={initialDataFromImport || initialData} // If you have other initialData logic
  // />
  // Or simply:
  // <ChapterForm
  //   ...
  //   initialData={initialDataFromImport}
  // />
  `);
   console.log("--------------------------------------------------");
   console.log("Happy coding!");
}

main().catch(console.error);