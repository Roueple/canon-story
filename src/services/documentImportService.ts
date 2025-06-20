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
    const pattern = /Chapter\s+(\d+(?:\.\d+)?)\s*[:|-]\s*(.+?)(?:\.\w+)?$/i;
    const match = filename.match(pattern);
    
    if (match) {
      return {
        number: parseFloat(match[1]),
        title: match[2].trim()
      };
    }
    // Fallback: try to get a number if "Chapter X" is not present but a number is
    const simpleNumberPattern = /^(\d+(?:\.\d+)?)[\s:_-]+(.+?)(?:\.\w+)?$/;
    const simpleMatch = filename.match(simpleNumberPattern);
    if (simpleMatch) {
        return {
            number: parseFloat(simpleMatch[1]),
            title: simpleMatch[2].trim()
        };
    }
    
    return { number: null, title: filename.replace(/\.\w+$/, '') };
  },

  async parseSingleDocx(buffer: Buffer, filename: string): Promise<ExtractedChapterInfo> {
    const result = await mammoth.convertToHtml({ buffer });
    let { number, title } = this.extractChapterInfoFromFilename(filename);
    
    const content = result.value.trim(); // Keep original spacing, HTML handles collapse
    
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
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
        errors.push(`Row ${rowNum}: Missing Chapter Number, Title, or Content.`);
        return;
      }
      if (typeof parseFloat(chapterNumber) !== 'number' || isNaN(parseFloat(chapterNumber))) {
        errors.push(`Row ${rowNum}: Chapter Number must be a valid number.`);
        return;
      }
      if (typeof title !== 'string' || title.trim() === '') {
        errors.push(`Row ${rowNum}: Title must be a non-empty string.`);
        return;
      }
       if (typeof content !== 'string' || content.trim() === '') {
        errors.push(`Row ${rowNum}: Content must be a non-empty string.`);
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
    
    if (errors.length > 0) throw new Error(`Validation errors:\n${errors.join('\n')}`);
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
    novelId: string,
    uploaderId: string, // Added for audit logging
    importRecordId: string // Added to update DocumentImport record
  ): Promise<{ created: number; errors: string[] }> {
    let createdCount = 0;
    const errorMessages: string[] = [];
    
    for (const chapter of chapters) {
      try {
        const slug = generateSlug(chapter.title);
        const wordCount = chapter.content.split(/\s+/).filter(w => w.length > 0).length;
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
        errorMessages.push(`Chapter ${chapter.chapterNumber} (${chapter.title}): ${error.message}`);
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