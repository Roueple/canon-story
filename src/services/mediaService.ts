import { serializePrismaData } from '@/lib/serialization';
// src/services/mediaService.ts
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const mediaService = {
  getUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'canon-story' },
      process.env.CLOUDINARY_API_SECRET!
    );
    return { timestamp, signature };
  },

  async saveUploadedMedia(data: {
    publicId: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    url: string;
    thumbnailUrl: string;
    uploadedBy: string;
    category?: string; // New: Optional category for the media file
    novelId?: string;   // New: Optional novelId to link media to a novel
  }) {
    const mediaFile = await prisma.mediaFile.create({
      data: {
        filename: data.publicId,
        originalName: data.originalName,
        mimeType: data.mimeType,
        fileSize: BigInt(data.fileSize),
        width: data.width,
        height: data.height,
        url: data.url,
        cdnUrl: data.url,
        thumbnailUrl: data.thumbnailUrl,
        uploadedBy: data.uploadedBy,
        category: data.category, // Save the new category
        novelId: data.novelId,   // Save the new novelId
      }
    });
    return serializePrismaData(mediaFile);
  },

  async findAll(options: { page?: number; limit?: number; search?: string; novelId?: string; category?: string; }) {
    const { page = 1, limit = 12, search, novelId, category } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      ...(search && { originalName: { contains: search, mode: 'insensitive' } }),
      ...(novelId && { novelId }),
      ...(category && { category }),
    };

    const [mediaFiles, total] = await Promise.all([
      prisma.mediaFile.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.mediaFile.count({ where })
    ]);

    return { mediaFiles: serializePrismaData(mediaFiles), total };
  },

  async findUniqueCategoriesByNovel(novelId: string) {
    const categories = await prisma.mediaFile.findMany({
      where: {
        novelId: novelId,
        isDeleted: false,
        category: { not: null } // Only include media with a category
      },
      distinct: ['category'],
      select: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    });
    return categories.map(c => c.category).filter(Boolean) as string[];
  },

  async delete(id: string) {
    const usageCount = await prisma.chapterMedia.count({ where: { mediaId: id } });
    if (usageCount > 0) throw new Error(`Cannot delete: media is used in ${usageCount} chapter(s).`);

    const deletedMedia = await prisma.mediaFile.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return serializePrismaData({ message: 'Media file marked as deleted.', media: deletedMedia });
  }
};