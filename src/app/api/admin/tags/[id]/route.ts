// src/app/api/admin/tags/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { tagService } from '@/services/tagService';

// GET a single tag by ID
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    const tag = await tagService.findById(id);
    if (!tag) return errorResponse('Tag not found', 404);
    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT to update a tag
export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const tag = await tagService.update(id, body);
    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE a tag
export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    await tagService.delete(id);
    return successResponse({ message: 'Tag deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});