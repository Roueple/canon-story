// src/app/api/public/novels/get-id-by-slug/[slug]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { novelService } from '@/services/novelService';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    if (!slug) {
      return errorResponse('Slug is required', 400);
    }
    const novelMeta = await novelService.getIdFromSlug(slug);
    if (!novelMeta) {
      return errorResponse('Novel not found', 404);
    }
    return successResponse(novelMeta);
  } catch (error) {
    return handleApiError(error);
  }
}