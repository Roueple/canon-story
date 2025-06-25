import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { tagService } from '@/services/tagService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    
    const tags = await tagService.findAll({ type, isActive: true });
    return successResponse(tags);
  } catch (error) {
    return handleApiError(error);
  }
}