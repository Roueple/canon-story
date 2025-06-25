// src/app/api/public/search/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { searchService } from '@/services/searchService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'novels';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Parse filters
    const filters: any = {};
    if (searchParams.get('genres')) {
      filters.genres = searchParams.get('genres')!.split(',');
    }
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('isPremium')) {
      filters.isPremium = searchParams.get('isPremium') === 'true';
    }
    if (searchParams.get('sortBy')) {
      filters.sortBy = searchParams.get('sortBy');
    }
    if (searchParams.get('sortOrder')) {
      filters.sortOrder = searchParams.get('sortOrder');
    }

    let result;
    if (type === 'chapters') {
      result = await searchService.searchChapters({ query, page, limit, filters });
    } else {
      result = await searchService.searchNovels({ query, page, limit, filters });
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}