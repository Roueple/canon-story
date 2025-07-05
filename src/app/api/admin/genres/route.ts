import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError } from '@/lib/api/utils';

export const GET = createAdminRoute(async () => {
  try {
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    });
    return successResponse(serializeForJSON(genres));
  } catch (error) {
    return handleApiError(error);
  }
});