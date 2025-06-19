// chat-6-docx-import-simplified.js
// Simplified DOCX Import without Redis or additional services

import fs from 'fs/promises';
import path from 'path';

async function createFile(filePath, content) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created/Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

async function updateFile(filePath, updateFunction) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const originalContent = await fs.readFile(fullPath, 'utf-8');
    const newContent = updateFunction(originalContent);
    if (originalContent.trim() !== newContent.trim()) {
      await fs.writeFile(fullPath, newContent.trim(), 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Chat 6: Simplified DOCX Import (No Redis needed!)...');
  console.log('========================================================\n');

  // 1. Update package.json - ONLY mammoth needed!
  await updateFile('package.json', (content) => {
    const pkg = JSON.parse(content);
    // Only add mammoth for DOCX parsing
    pkg.dependencies['mammoth'] = '^1.6.0';
    // Remove Redis dependencies if they were added
    delete pkg.dependencies['bull'];
    delete pkg.dependencies['ioredis'];
    return JSON.stringify(pkg, null, 2);
  });

  // 2. Update Prisma schema - Keep it simple
  await updateFile('prisma/schema.prisma', (content) => {
    if (content.includes('model DocumentImport')) {
      return content;
    }
    
    // Simple import tracking without queue
    const importModel = `
model DocumentImport {
  id                   String    @id @default(uuid())
  filename             String
  originalSize         BigInt
  mimeType             String
  novelId              String?
  uploadedBy           String
  status               String    @default("pending") // pending, processing, completed, failed
  progress             Int       @default(0) // percentage
  chaptersCreated      Int       @default(0)
  imagesExtracted      Int       @default(0)
  errorMessage         String?
  processingStarted    DateTime?
  processingCompleted  DateTime?
  extractedContent     Json?     // structured content from DOCX
  importSettings       Json?     @default("{}") // import configuration
  cloudinaryUrl        String?   // Store DOCX file in Cloudinary temporarily
  createdAt            DateTime  @default(now())

  novel    Novel? @relation(fields: [novelId], references: [id], onDelete: SetNull)
  uploader User   @relation(fields: [uploadedBy], references: [id], onDelete: Restrict)

  @@index([status])
  @@index([uploadedBy])
  @@index([novelId])
}`;

    // Add after ChapterContent model
    return content.replace(
      'model ContentTemplates {',
      `${importModel}\n\nmodel ContentTemplates {`
    );
  });

  // 3. Create simplified document import service
  await createFile('src/services/documentImportService.ts', `
// src/services/documentImportService.ts
import { prisma } from '@/lib/db';
import mammoth from 'mammoth';
import { v2 as cloudinary } from 'cloudinary';
import { generateSlug, calculateReadingTime } from '@/lib/utils';

// Configure Cloudinary (already done in your media service)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

interface ImportOptions {
  novelId: string;
  userId: string;
  chapterNumberStart?: number;
  importAsPublished?: boolean;
  importAsPremium?: boolean;
}

interface ExtractedImage {
  buffer: Buffer;
  contentType: string;
  originalName: string;
}

interface ParsedChapter {
  title: string;
  content: string;
  images: ExtractedImage[];
  wordCount: number;
}

export const documentImportService = {
  // Upload DOCX to Cloudinary for temporary storage
  async uploadDocxToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'canon-story/imports/docx',
          resource_type: 'raw',
          public_id: \`docx_\${Date.now()}_\${filename.replace(/\\.docx$/, '')}\`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  },

  // Parse DOCX file and extract content
  async parseDocx(buffer: Buffer): Promise<ParsedChapter[]> {
    try {
      const result = await mammoth.convertToHtml({
        buffer,
        convertImage: mammoth.images.imgElement((image) => {
          return image.read().then((buffer) => {
            return {
              src: \`data:\${image.contentType};base64,\${buffer.toString('base64')}\`,
            };
          });
        }),
      });

      if (result.messages.length > 0) {
        console.warn('DOCX parsing warnings:', result.messages);
      }

      const chapters = this.splitIntoChapters(result.value);
      const parsedChapters: ParsedChapter[] = [];
      
      for (const chapter of chapters) {
        const images = await this.extractImagesFromHtml(chapter.content);
        const cleanContent = this.cleanHtmlContent(chapter.content);
        const wordCount = cleanContent.split(/\\s+/).filter(word => word.length > 0).length;
        
        parsedChapters.push({
          title: chapter.title,
          content: cleanContent,
          images,
          wordCount,
        });
      }

      return parsedChapters;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  },

  // Split HTML content into chapters
  splitIntoChapters(html: string): { title: string; content: string }[] {
    const chapters: { title: string; content: string }[] = [];
    const parts = html.split(/<h1[^>]*>/);
    
    if (parts.length <= 1) {
      return [{
        title: 'Imported Chapter',
        content: html,
      }];
    }

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const titleEndIndex = part.indexOf('</h1>');
      
      if (titleEndIndex > -1) {
        const title = part.substring(0, titleEndIndex).replace(/<[^>]*>/g, '').trim();
        const content = part.substring(titleEndIndex + 5).trim();
        
        if (title && content) {
          chapters.push({ title, content });
        }
      }
    }

    return chapters;
  },

  // Extract base64 images from HTML
  async extractImagesFromHtml(html: string): Promise<ExtractedImage[]> {
    const images: ExtractedImage[] = [];
    const imgRegex = /<img[^>]+src="data:([^;]+);base64,([^"]+)"/g;
    
    let match;
    let imageIndex = 0;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      images.push({
        buffer,
        contentType,
        originalName: \`image_\${imageIndex++}.png\`,
      });
    }

    return images;
  },

  // Clean HTML content
  cleanHtmlContent(html: string): string {
    let cleaned = html.replace(/<img[^>]+src="data:[^"]+"/g, '<img src=""');
    return cleaned;
  },

  // Upload image to Cloudinary
  async uploadImageToCloudinary(image: ExtractedImage, importId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'canon-story/chapters',
          public_id: \`import_\${importId}_\${Date.now()}\`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(image.buffer);
    });
  },

  // Create import record
  async createImportRecord(
    filename: string,
    fileSize: number,
    mimeType: string,
    userId: string,
    novelId: string,
    cloudinaryUrl: string,
    settings: any
  ): Promise<string> {
    const importRecord = await prisma.documentImport.create({
      data: {
        filename,
        originalSize: fileSize,
        mimeType,
        novelId,
        uploadedBy: userId,
        cloudinaryUrl,
        importSettings: settings,
        status: 'pending',
      },
    });

    return importRecord.id;
  },

  // Process import synchronously with progress updates
  async processImport(importId: string): Promise<void> {
    const importRecord = await prisma.documentImport.findUnique({
      where: { id: importId },
    });

    if (!importRecord || !importRecord.cloudinaryUrl) {
      throw new Error('Import record not found');
    }

    try {
      // Update status
      await prisma.documentImport.update({
        where: { id: importId },
        data: {
          status: 'processing',
          processingStarted: new Date(),
        },
      });

      // Download DOCX from Cloudinary
      const response = await fetch(importRecord.cloudinaryUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Parse DOCX
      const chapters = await this.parseDocx(buffer);
      
      const settings = importRecord.importSettings as any || {};
      let chapterNumber = settings.chapterNumberStart || 1;
      const createdChapters = [];
      let totalImages = 0;

      for (const [index, chapter] of chapters.entries()) {
        // Upload images
        const uploadedImages = [];
        
        for (const image of chapter.images) {
          const cloudinaryResult = await this.uploadImageToCloudinary(image, importId);
          
          const mediaFile = await prisma.mediaFile.create({
            data: {
              filename: cloudinaryResult.public_id,
              originalName: image.originalName,
              mimeType: image.contentType,
              fileSize: BigInt(image.buffer.length),
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              url: cloudinaryResult.secure_url,
              cdnUrl: cloudinaryResult.secure_url,
              thumbnailUrl: \`https://res.cloudinary.com/\${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/\${cloudinaryResult.public_id}\`,
              uploadedBy: importRecord.uploadedBy,
            },
          });
          
          uploadedImages.push(mediaFile);
          totalImages++;
        }

        // Replace image placeholders
        let processedContent = chapter.content;
        uploadedImages.forEach((img) => {
          processedContent = processedContent.replace(
            /<img src=""/, 
            \`<img src="\${img.url}" alt="\${img.altText || ''}"\`
          );
        });

        // Create chapter
        const newChapter = await prisma.chapter.create({
          data: {
            novelId: importRecord.novelId!,
            title: chapter.title,
            content: processedContent,
            slug: generateSlug(chapter.title),
            chapterNumber: chapterNumber,
            displayOrder: chapterNumber,
            wordCount: chapter.wordCount,
            estimatedReadTime: calculateReadingTime(chapter.wordCount),
            status: settings.importAsPremium ? 'premium' : 'free',
            isPublished: settings.importAsPublished || false,
            hasImages: uploadedImages.length > 0,
            imageCount: uploadedImages.length,
            importedFrom: importRecord.filename,
            importedAt: new Date(),
          },
        });

        // Link images to chapter
        for (const [index, img] of uploadedImages.entries()) {
          await prisma.chapterMedia.create({
            data: {
              chapterId: newChapter.id,
              mediaId: img.id,
              position: index,
            },
          });
        }

        createdChapters.push(newChapter);
        chapterNumber++;

        // Update progress
        const progress = Math.round(((index + 1) / chapters.length) * 100);
        await prisma.documentImport.update({
          where: { id: importId },
          data: { progress },
        });
      }

      // Update import as completed
      await prisma.documentImport.update({
        where: { id: importId },
        data: {
          status: 'completed',
          progress: 100,
          chaptersCreated: createdChapters.length,
          imagesExtracted: totalImages,
          processingCompleted: new Date(),
          extractedContent: {
            chapters: createdChapters.map(ch => ({
              id: ch.id,
              title: ch.title,
              wordCount: ch.wordCount,
            })),
          },
        },
      });

      // Update novel word count
      if (importRecord.novelId) {
        const totalWordCount = await prisma.chapter.aggregate({
          where: { novelId: importRecord.novelId, isDeleted: false },
          _sum: { wordCount: true },
        });

        await prisma.novel.update({
          where: { id: importRecord.novelId },
          data: {
            wordCount: totalWordCount._sum.wordCount || 0,
            updatedAt: new Date(),
          },
        });
      }

      // Clean up temporary file from Cloudinary after successful import
      try {
        const publicId = importRecord.cloudinaryUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }

    } catch (error) {
      await prisma.documentImport.update({
        where: { id: importId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  },

  // Get import status
  async getImportStatus(importId: string) {
    return await prisma.documentImport.findUnique({
      where: { id: importId },
      include: {
        novel: {
          select: { id: true, title: true },
        },
        uploader: {
          select: { id: true, displayName: true },
        },
      },
    });
  },

  // Get import history
  async getImportHistory(userId?: string, novelId?: string) {
    const where: any = {};
    if (userId) where.uploadedBy = userId;
    if (novelId) where.novelId = novelId;

    return await prisma.documentImport.findMany({
      where,
      include: {
        novel: {
          select: { id: true, title: true },
        },
        uploader: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },
};
`);

  // 4. Update API routes - simpler without queues
  await createFile('src/app/api/admin/import/upload/route.ts', `
// src/app/api/admin/import/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const novelId = formData.get('novelId') as string;
    const settings = JSON.parse(formData.get('settings') as string || '{}');

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file type
    if (!file.name.endsWith('.docx')) {
      return errorResponse('Only DOCX files are supported', 400);
    }

    // File size limit (25MB for Cloudinary free tier)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse('File size exceeds 25MB limit', 400);
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload DOCX to Cloudinary for temporary storage
    const cloudinaryUrl = await documentImportService.uploadDocxToCloudinary(buffer, file.name);

    // Create import record
    const importId = await documentImportService.createImportRecord(
      file.name,
      file.size,
      file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      user.id,
      novelId,
      cloudinaryUrl,
      settings
    );

    // Process immediately in the background
    // In production, you might want to use Vercel's Edge Functions or similar
    documentImportService.processImport(importId).catch(error => {
      console.error('Import processing error:', error);
    });

    return successResponse({ importId }, 201);
  } catch (error) {
    return handleApiError(error);
  }
});

export const config = {
  runtime: 'nodejs',
  maxDuration: 30, // Allow longer execution for file processing
};
`);

  // 5. Keep the same components but remove queue references
  // (DocumentImporter and ImportHistory components remain the same)

  // 6. Create a simpler utility for checking imports
  await createFile('src/hooks/useImportStatus.ts', `
// src/hooks/useImportStatus.ts
import { useState, useEffect } from 'react';

interface ImportStatus {
  id: string;
  status: string;
  progress: number;
  errorMessage?: string;
  chaptersCreated?: number;
  imagesExtracted?: number;
}

export function useImportStatus(importId: string | null) {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!importId) return;

    const checkStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch(\`/api/admin/import/status/\${importId}\`);
        const result = await response.json();
        
        if (result.success) {
          setStatus(result.data);
          
          // Continue polling if still processing
          if (result.data.status === 'processing') {
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking import status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [importId]);

  return { status, loading };
}
`);

  console.log('\n✅ Chat 6: Simplified DOCX Import System completed!');
  console.log('\n📋 This implementation:');
  console.log('- ✅ Uses Cloudinary for temporary DOCX storage');
  console.log('- ✅ Uses your existing Neon database for tracking');
  console.log('- ✅ No Redis or additional services needed!');
  console.log('- ✅ Processes files synchronously (good for MVP)');
  console.log('- ✅ Still supports all features (bulk upload, progress tracking, etc.)');
  console.log('\n📋 Next Steps:');
  console.log('1. Install only mammoth:');
  console.log('   npm install mammoth');
  console.log('\n2. Apply database migrations:');
  console.log('   npx prisma db push');
  console.log('\n3. Restart your development server:');
  console.log('   npm run dev');
  console.log('\n4. Test the import feature - no Redis needed!');
  console.log('\n⚠️  Note for production scale:');
  console.log('- Current implementation processes files synchronously');
  console.log('- For heavy usage, consider Vercel Functions with longer timeouts');
  console.log('- Or implement a simple polling system with database status checks');
  console.log('- But for MVP and moderate usage, this solution is perfect!');
}

main().catch(console.error);