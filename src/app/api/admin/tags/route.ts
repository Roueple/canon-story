
// src/app/api/admin/tags/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { tagService } from '@/services/tagService';

export const GET = createAdminRoute(async (req) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    
    // --- THIS IS THE CRITICAL FIX ---
    // Handle the isActive parameter correctly. It can be true, false, or not present.
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === null ? undefined : isActiveParam === 'true';

    const tags = await tagService.findAll({ type, isActive });
    return successResponse(tags);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = createAdminRoute(async (req) => {
  try {
    const body = await req.json();
    const { name, type, color } = body;

    if (!name || !type) {
      return errorResponse('Name and type are required', 400);
    }

    const tag = await tagService.create({ name, type, color });
    return successResponse(tag, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
