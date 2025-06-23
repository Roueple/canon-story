// src/app/api/admin/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Novel ID is required', 400);
    const novel = await novelService.findById(id, true);
    if (!novel) return errorResponse('Novel not found', 404);
    return successResponse(novel);
  } catch (error) { 
    return handleApiError(error) 
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Novel ID is required', 400);
    const body = await req.json();
    const novel = await novelService.update(id, body);
    return successResponse(novel);
  } catch (error) { 
    return handleApiError(error) 
  }
});

export const DELETE = createAdminRoute(async (req, { user, params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Novel ID is required', 400);
    await novelService.softDelete(id, user.id);
    return successResponse({ message: 'Novel deleted successfully' });
  } catch (error) { 
    return handleApiError(error) 
  }
});