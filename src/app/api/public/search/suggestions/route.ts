// src/app/api/public/search/suggestions/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { searchService } from '@/services/searchService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    const suggestions = await searchService.getSearchSuggestions(query, limit);
    return successResponse(suggestions);
  } catch (error) {
    return handleApiError(error);
  }
}