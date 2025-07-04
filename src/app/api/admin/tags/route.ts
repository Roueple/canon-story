// src/app/api/admin/tags/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { tagService } from '@/services/tagService';

// GET all tags for the admin panel
export const GET = createAdminRoute(async (req) => {
  try {
    const tags = await tagService.findAll(); 
    return successResponse(tags);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST to create a new tag
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