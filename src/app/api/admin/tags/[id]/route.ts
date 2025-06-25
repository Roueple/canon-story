// src/app/api/admin/tags/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { tagService } from '@/services/tagService';

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Tag ID is required', 400);
    
    const tag = await tagService.findById(id);
    if (!tag) return errorResponse('Tag not found', 404);
    
    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Tag ID is required', 400);
    
    const body = await req.json();
    const tag = await tagService.update(id, body);
    
    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Tag ID is required', 400);
    
    await tagService.delete(id);
    return successResponse({ message: 'Tag deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});