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
          public_id: `docx_${Date.now()}_${filename.replace(/\.docx$/, '')}`,
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
              src: `data:${image.contentType};base64,${buffer.toString('base64')}`,
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
        const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
        
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
        originalName: `image_${imageIndex++}.png`,
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
          public_id: `import_${importId}_${Date.now()}`,
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
              thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${cloudinaryResult.public_id}`,
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
            `<img src="${img.url}" alt="${img.altText || ''}"`
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